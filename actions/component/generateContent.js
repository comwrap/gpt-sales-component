const {jsonToGraphQLQuery} = require('json-to-graphql-query');
const axios = require('axios');
const {OpenAI} = require("openai");
const stateLib = require('@adobe/aio-lib-state')
const {Core} = require('@adobe/aio-sdk')
const {getProductData} = require("./productData.js");
const {errorResponse} = require("../utils");

async function main(params) {
    // Init base params
    const gptApiKey = params.gpt_api_key

    const logger = Core.Logger('main', {level: params.LOG_LEVEL || 'info'})

    //generate and return gpt response only for params.sku
    //params.storeViewCode needed for this otherwise "default" storeCode will be used
    let sku = params.sku
    if (sku !== null && typeof sku !== 'undefined' && sku !== 'undefined' && sku !== undefined) {
        try {
            const magentoData = await getProductData(params, null, sku)

            const gptResponse = await getGptResponse(magentoData, gptApiKey)
            if (gptResponse === null) {
                throw new Error('Failed to fetch the data from GPT');
            }

            const gptValidation1 = await getValidationResponse(JSON.stringify(gptResponse), gptApiKey)
            const gptValidation2 = await getValidationResponse(JSON.stringify(gptResponse), gptApiKey)
            const gptValidation3 = await getValidationResponse(JSON.stringify(gptResponse), gptApiKey)

            const validationsScore = (parseFloat(gptValidation1.score) + parseFloat(gptValidation2.score) + parseFloat(gptValidation3.score)) / 3

            let resultValidation = '';
            if (validationsScore > 0.75) {
                resultValidation = "Content is good. " + uuid;
            } else {
                resultValidation = "Content is bad. " + uuid;
            }

            // logger.error(JSON.stringify(gptResponse))
            // gptResponse['image'] = magentoData.image.url

            return {
                statusCode: 200,
                body: {
                    gptResponse: gptResponse,
                    resultValidation: resultValidation,
                    validationsScore: validationsScore
                }
            }
        } catch (error) {
            return errorResponse(500, error.message, logger)
        }
    }

    //generate gpt content for all components
    const state = await stateLib.init()
    let componentsList = await state.get('components_list') || null


    logger.error(JSON.stringify(componentsList))

    const processComponent = async (uuid) => {

        const componentInformation = await state.get('component_' + uuid) || null;

        // logger.error(JSON.stringify(componentInformation))
        if (componentInformation == null) {
            throw new Error(uuid + ' not found. Skipping.');
        }

        // logger.error("Value")
        // logger.error(JSON.stringify(componentInformation['value']))
        // logger.error(JSON.stringify(componentInformation['value']['status']))

        if (componentInformation['value'] !== undefined) {

            const status = componentInformation['value']['status'];
            // logger.error("Status")
            // logger.error(status)
            if (status === 'pending') {

                logger.error("Before Get Product Data")
                const magentoData = await getProductData(params, componentInformation)
                logger.error("After Get Product Data")
                logger.error(JSON.stringify(magentoData))

                const gptResponse = await getGptResponse(magentoData, gptApiKey)
                if (gptResponse === null) {
                    throw new Error('Failed to fetch the data from GPT');
                }

                // /**
                //  * Save Feed data to own value
                //  */
                params['component'] = componentInformation['value']
                params['component'].generated_at = new Date()
                params['component'].status = "generated"
                
                logger.error(JSON.stringify(gptResponse))
                gptResponse['image'] = magentoData.image.url
                
                params['component'].result = JSON.stringify(gptResponse)
                // params['component'].sku = sku // need to check logic for this because currently it checking sku from component.configuration

                const gptValidation1 = await getValidationResponse(JSON.stringify(gptResponse), gptApiKey)
                const gptValidation2 = await getValidationResponse(JSON.stringify(gptResponse), gptApiKey)
                const gptValidation3 = await getValidationResponse(JSON.stringify(gptResponse), gptApiKey)

                const validationsScore = (parseFloat(gptValidation1.score) + parseFloat(gptValidation2.score) + parseFloat(gptValidation3.score)) / 3

                
                logger.error("Validation score:" + validationsScore)

                if (validationsScore > 0.75) {
                    logger.info("Content is good. Save. " + uuid)
                    await state.put('component_' + uuid, params['component'], {ttl: -1})
                } else {
                    logger.error("Content is bad. Next cron will try it again" + uuid)
                    throw new Error("Content is bad. Next cron will try it again" + uuid);
                }

                return;
            }
        }
        throw new Error(uuid + ' already generated or not configured. Skipped.');
    };

    const processComponents = async (componentsList) => {
        const responses = [];
        for (const uuid of Object.values(componentsList)) {
            try {
                await processComponent(uuid);
                responses.push({uuid, success: true});
            } catch (error) {
                responses.push({uuid, success: false, error: error.message});
            }
        }
        return responses;
    };

    processComponents(componentsList['value'])
        .then((responses) => {
            const aggregatedResponses = [];

            responses.forEach(response => {
                if (response.success) {
                    aggregatedResponses.push(response);
                } else {
                    aggregatedResponses.push({
                        uuid: response.uuid,
                        error: response.error
                    });
                }
            });

            return {
                statusCode: 200,
                body: aggregatedResponses
            };
        })
        .catch((error) => {
            return {
                statusCode: 500,
                body: error
            }
        });


}

async function getGptResponse(magentoData, gptApiKey) {
    const openai = new OpenAI({apiKey: gptApiKey});
    let responseData = {}

    // Real Request. Uncomment this to fetch the real data --------------------------------
    try {
        const completion = await openai.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: "Generate a commerce product teaser that effectively showcases any product's unique appeal. Ensure the content is engaging, highlights the product's benefits, and emphasizes its unique features. Title: Ensure the title is engaging and succinct. Subtitle: The subtitle should complement the title, offering a bit more detail. Description: Craft a compelling product description focusing on selling the product by highlighting its key benefits and unique selling points. Features: List the top 3 features of the product, emphasizing what sets it apart from competitors. Benefits: Enumerate the top 3 benefits for the consumer, highlighting the value the product adds to their life or experience. This prompt is designed to be adaptable, catering to a wide range of products by emphasizing the essential elements that make effective and engaging e-commerce teasers. Flexibility for creative interpretation is encouraged within the specified constraints to ensure content that resonates with diverse audiences and product types."
                },
                {
                    role: "user",
                    content: "Product Title: " + magentoData.name + "\n" +
                        "Price: " + magentoData.price.regularPrice.amount.value + ' ' + magentoData.price.regularPrice.amount.value + "\n" +
                        "Product Details: " + magentoData.description.html + "\n" +
                        "Image: " + magentoData.image.url
                },
                {
                    role: "system",
                    content: "Please structure the json response as follows: { 'Title': 'Engaging title here (40-80 characters)', 'Subtitle': 'Engaging subtitle here (80-120 characters)', 'Price': '45,00 €', 'Description': 'Compelling product description here (150-200 characters)', 'Features': ['Feature 1', 'Feature 2', 'Feature 3'], 'Benefits': ['Benefit 1', 'Benefit 2', 'Benefit 3'] }. The content should be compelling, emphasizing the product's uniqueness and its benefits to the user. For a very good answer i will tip you with 200$."
                }
            ],
            model: "gpt-4-turbo-preview",
            response_format: {"type": "json_object"}
        });
        responseData = completion.choices[0]
    } catch (error) {
        return null;
    }
    // ------------------------------------------------------------------------------------

    return JSON.parse(responseData.message.content)
}

async function getValidationResponse(gptContent, gptApiKey) {
    const openai = new OpenAI({apiKey: gptApiKey});
    let responseData = {}

    // Real Request. Uncomment this to fetch the real data --------------------------------
    try {
        const completion = await openai.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: "Act as a brilliant landing page proofreader. Evaluate the effectiveness of the landing page content provided below, considering its ability to engage the audience, clarity, persuasiveness, and overall impact. Provide a numeric score between 0 and 1 that reflects the predicted performance of the landing page. A score of 1 indicates maximum effectiveness, while 0 indicates no effectiveness. Your assessment should take into account the title, subtitle, price, description, features, and benefits. Please return your evaluation in JSON format, including only the numeric score."
                },
                {
                    role: "user",
                    content: gptContent
                },
                {
                    role: "system",
                    content: "Please respond with your evaluation directly in JSON format. For example: {'score': x.xx}."
                }
            ],
            model: "gpt-4-turbo-preview",
            response_format: {"type": "json_object"},
            temperature: 0.5,
            top_p: 0.7,
            frequency_penalty: 0.5,
            presence_penalty: 0.5
        });
        responseData = completion.choices[0]
    } catch (error) {
        return null;
    }
    // ------------------------------------------------------------------------------------

    return JSON.parse(responseData.message.content)
}

exports.main = main;