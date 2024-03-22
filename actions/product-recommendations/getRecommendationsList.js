// const {RecommendationsClient} = require('@magento/recommendations-js-sdk')//doesn't work
const fetch = require('node-fetch')
const {Core} = require('@adobe/aio-sdk')
const {getUnitsList} = require('./recsData.js')
const {errorResponse, getBearerToken, stringParameters, checkMissingRequestInputs} = require('../utils')

// main function that will be executed by Adobe I/O Runtime
async function main(params) {
    // create a Logger
    const logger = Core.Logger('main', {level: params.LOG_LEVEL || 'info'})

    try {
        // 'info' is the default level if not set
        logger.info('Calling getRecommendationsList action')

        // log parameters, only if params.LOG_LEVEL === 'debug'
        logger.debug(stringParameters(params))

        let getListResponse = await getUnitsList(params)

        // log the response status code
        logger.info(`getUnitsList: successful request`)
        logger.debug(JSON.stringify(getListResponse))

        return {
            statusCode: 200,
            body: getListResponse
        }
    } catch (error) {
        // log any server errors
        logger.error(error)
        // return with 500
        return errorResponse(500, error.message, logger)
    }
}

exports.main = main
