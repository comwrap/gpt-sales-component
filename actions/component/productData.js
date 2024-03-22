const {getUnitsList, getProductFromUnit} = require("./../product-recommendations/recsData.js");
const {jsonToGraphQLQuery} = require("json-to-graphql-query");
const axios = require("axios");
const {Core} = require("@adobe/aio-sdk");

/**
 * Get product data for gpt generator
 *
 * @return {Promise<void>}
 */
async function getProductData(params, componentInformation = null, sku = null) {
    const logger = getLogger(params);
    const magentoUrl = params.AC_URL

    logger.error(magentoUrl)

    if (sku === null && componentInformation === null) {
        throw new Error('Both sku and componentInformation are null');
    }

    if (sku === null) {
        sku = await getSkuForComponent(params, componentInformation);
    }

//    if (sku !== null && sku.length > 16) {
//        throw new Error('Invalid SKU parameter. SKU must be a string of 16 characters or less.');
//    }

    let storeViewCode = params.storeViewCode
    if (componentInformation !== null) {
        storeViewCode = componentInformation.value.configuration.store_code
    }
    if (storeViewCode === null || typeof storeViewCode === 'undefined' || storeViewCode === 'undefined' || storeViewCode === undefined) {
        storeViewCode = "default"
    }

    logger.error("Store Code before GET: " + storeViewCode)
    logger.error("SKU Before Get: " + sku)


    const magentoData = await getProductDataFromMagento(magentoUrl, sku, storeViewCode)
    logger.error("After getProductDataFromMagento")
    logger.error(JSON.stringify(magentoData))
    if (magentoData === null) {
        throw new Error('Failed to fetch product data from Magento.');
    }
    return magentoData
}

/**
 * Get sku based on component configuration
 * from component configuration itself or from product reco
 *
 * @param params
 * @param componentInformation
 * @return {Promise<string|*|string|number|Object|List|boolean|null>}
 */
async function getSkuForComponent(params, componentInformation) {
    const logger = Core.Logger(params)

    logger.error("Component information inside of getSkuForComponent")
    logger.error(JSON.stringify(componentInformation))

    if (
        componentInformation &&
        componentInformation.value &&
        componentInformation.value.configuration &&
        componentInformation.value.configuration.sku &&
        componentInformation.value.configuration.sku !== ""
    ) {
        logger.error("SKU returned: " + componentInformation.value.configuration.sku)
        return componentInformation.value.configuration.sku
    }

    if (
        componentInformation &&
        componentInformation.value &&
        componentInformation.value.configuration &&
        componentInformation.value.configuration.product_recommendations_unit &&
        componentInformation.value.configuration.product_recommendations_unit !== ""
    ) {
        const productRecommendationsUnit = componentInformation.value.configuration.product_recommendations_unit;
        logger.info("Product Recommendations Unit: " + productRecommendationsUnit);

        params.storeViewCode = componentInformation.value.configuration.store_code
        const getListResponse = await getUnitsList(params)
        // Check if results exist and is not empty
        if (!getListResponse.results || getListResponse.results.length === 0) {
            throw new Error("No results found in getListResponse");
        }

        const unitItem = getListResponse.results.find(item => item.unitId === productRecommendationsUnit);
        if (!unitItem) {
            throw new Error("Unit item not found for product recommendations unit: " + productRecommendationsUnit);
        }

        params.websiteCode = params.AC_WEBSITE_CODE
        params.environmentId = unitItem.environmentId
        params.unitId = productRecommendationsUnit
        const product = await getProductFromUnit(params)
        if (product != null && product.sku) {
            return product.sku
        } else {
            throw new Error("Failed to get product from recommendations or didnt found anything.");
        }
    } else {
        logger.info("Product Recommendations Unit does not exist or is empty.:");
        throw new Error("Product Recommendations Unit does not exist or is empty.");
    }
    return null;
}

function getLogger(params = null) {
    if (params && params.LOG_LEVEL) {
        return Core.Logger('main', {level: params.LOG_LEVEL})
    }
    return Core.Logger('main', {level: 'info'})
}

async function getProductDataFromMagento(url, sku, storeViewCode) {

    const logger = getLogger();

    // Prepare the GraphQL query
    let gqlQuery = {
        query: {
            products: {
                __args: {
                    filter: {
                        sku: {
                            eq: sku
                        }
                    },
                    pageSize: 1,
                    currentPage: 1
                },
                items: {
                    sku: true,
                    name: true,
                    description: {
                        html: true
                    },
                    image: {
                        url: true
                    },
                    price: {
                        regularPrice: {
                            amount: {
                                value: true,
                                currency: true
                            }
                        }
                    }
                }
            }
        }
    };

    let graphqlQuery = jsonToGraphQLQuery(gqlQuery, {pretty: false});
    logger.error("graphqlQuery")
    logger.error(JSON.stringify(graphqlQuery))
    logger.error("Store View Code: " + storeViewCode)
    logger.error("URL: " + url)
    

    try {
        const response = await axios.post(
            url,
            {query: graphqlQuery},
            {
                headers: {
                    Store: storeViewCode
                }
            }
        )

        logger.error("Magento Response")
        // logger.error(JSON.stringify(response))

        if (typeof response.data.data.products.items[0] !== 'undefined') {
            return response.data.data.products.items[0];
        }
        return null
    } catch (error) {
        return null
    }
}

module.exports = {
    getProductData,
    getProductDataFromMagento
}
