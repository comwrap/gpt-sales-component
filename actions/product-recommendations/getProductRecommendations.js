// const {RecommendationsClient} = require('@magento/recommendations-js-sdk')//doesn't work
const fetch = require('node-fetch')
const {Core} = require('@adobe/aio-sdk')
const {getProductFromUnit} = require('./recsData.js')
const {errorResponse, getBearerToken, stringParameters, checkMissingRequestInputs} = require('../utils')

// main function that will be executed by Adobe I/O Runtime
async function main(params) {
    // create a Logger
    const logger = Core.Logger('main', {level: params.LOG_LEVEL || 'info'})

    try {
        // 'info' is the default level if not set
        logger.info('Calling getProductRecommendations action')

        // log parameters, only if params.LOG_LEVEL === 'debug'
        logger.debug(stringParameters(params))

        const product = await getProductFromUnit(params);

        if (product == null) {
            throw new Error('Not found any product in Unit.');
        }

        logger.info(`getProductFromUnit: successful request`)
        logger.debug(JSON.stringify(product))

        return {
            statusCode: 200,
            body: product
        }
    } catch (error) {
        logger.error(error)
        return errorResponse(error.statusCode, error.message, logger)
    }
}

exports.main = main
