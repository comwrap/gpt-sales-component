const {sign} = require('jsonwebtoken')
const axios = require('axios');
const {Core} = require('@adobe/aio-sdk')

/**
 *
 * @param params
 * @return {*}
 *
 * @see \Magento\ServicesConnector\Model\JwtSignatureToken::getSignature
 */
function getSignature(params) {
    const privateKey = params['ADOBE_SAAS_API_PRIVATE'];
    const now = Math.floor(Date.now() / 1000); // Current timestamp in seconds

    //@see \Magento\ServicesConnector\Model\JwtSignatureToken::getSignature to get correct signature payload
    const payload = {
        'exp': now + 300, // Expiration time (current time + 300 seconds)
        'iss': '8E6307BF5D775FA00A495EF9@AdobeOrg', // Issuer
        'sub': '3181519E5E2714990A495E2E@techacct.adobe.com', // Subject
        'https://ims-na1.adobelogin.com/s/ent_reactor_sdk': true,
        'https://ims-na1.adobelogin.com/s/asset_compute_meta': true,
        'https://ims-na1.adobelogin.com/s/ent_adobeio_sdk': true,
        'https://ims-na1.adobelogin.com/s/event_receiver_api': true,
        'aud': 'https://ims-na1.adobelogin.com/c/9ec9d05f79eb443e8f76ce477b1e413c'
    };

    const options = {
        algorithm: 'RS256'//, // Algorithm to use for signing the token (RSA-SHA256)
        //expiresIn: '5m' // Cannot be used here anymore because expiration date already set in payload ('exp' field)
    };

    const signed = sign(payload, privateKey, options);//x-gw-signature header
    return signed;
}

/**
 *
 * @param params
 * @param url
 * @param data
 * @param method
 * @return {Promise<void>}
 *
 * @see magento \Magento\ServicesConnector\Model\ClientResolver::getMagentoJwtSettingsMiddleware
 * @see magento vendor/magento/services-connector/etc/config.xml
 *             <production_gateway_url>https://commerce.adobe.io/</production_gateway_url>
 *             <sandbox_gateway_url>https://commerce-beta.adobe.io/</sandbox_gateway_url>
 *             <production_key_validation_url>/merchant-registry/v1/ping</production_key_validation_url>
 *             <sandbox_key_validation_url>/merchant-registry/v1/ping</sandbox_key_validation_url>
 *             <cloudfront_validation_url>/merchant-registry/index.html</cloudfront_validation_url>
 *             <cloudfront_validation_domains>commerce-beta.adobe.io</cloudfront_validation_domains>
 *             <api_portal_url>https://account.magento.com/apiportal/index/index/</api_portal_url>
 *             <production_magi_gateway_url>https://api.magento.com/</production_magi_gateway_url>
 *             <sandbox_magi_gateway_url>https://sandbox.api.magento.com/</sandbox_magi_gateway_url>
 */
async function requestSaasRecsAdmin(params, url, data, method = 'get') {
    const sassPublicKey = params['ADOBE_SAAS_API_PUBLIC'];
    // Define the headers
    const headers = {
        'magento-api-key': sassPublicKey,
        'x-api-key': sassPublicKey,
        'x-gw-signature': getSignature(params),
        'Content-Type': 'application/json'
    };

    try {
        let response;
        url = 'https://commerce.adobe.io/recs-admin/v1' + url;
        switch (method.toUpperCase()) {
            case 'GET':
                response = await axios.get(url, {headers});
                break;
            case 'POST':
                response = await axios.post(url, data, {headers});
                break;
            case 'PUT':
                response = await axios.put(url, data, {headers});
                break;
            default:
                throw new Error('Unsupported HTTP method');
        }

        // Process the response
        // console.log('Response:', response.data);
        return response.data;
    } catch (error) {
        // Handle any errors
        error.message = "requestSaasRecsAdmin error: " + error.message + ", statusCode: " + error.statusCode;
        error.statusCode = 500;
        throw error
    }
}

/**
 *
 * @param params
 * @param url
 * @param data
 * @param method
 * @param recsOpen
 * @return {Promise<void>}
 */
async function requestSaasRecs(params, url, data, method = 'post', recsOpen = false) {
    const sassPublicKey = params['ADOBE_SAAS_API_PUBLIC'];
    // Define the headers
    const headers = {
        'x-api-key': 'recs_open',
        'Content-Type': 'application/json'
    };

    if (recsOpen === false) {
        headers['x-api-key'] = sassPublicKey;
        headers['x-gw-signature'] = getSignature(params);
        headers['magento-api-key'] = sassPublicKey;
    }

    try {
        let response;
        url = 'https://commerce.adobe.io/recs/v1/precs' + url;


        const logger = Core.Logger('main', {level: params.LOG_LEVEL || 'info'})
        logger.error(url)
        logger.error(JSON.stringify(headers))
        logger.error(JSON.stringify(data))

        switch (method.toUpperCase()) {
            case 'GET':
                response = await axios.get(url, {headers});
                break;
            case 'POST':
                response = await axios.post(url, data, {headers});
                break;
            case 'PUT':
                response = await axios.put(url, data, {headers});
                break;
            default:
                throw new Error('Unsupported HTTP method');
        }


        // Process the response
        // console.log('Response:', response.data);
        return response.data;
    } catch (error) {
        // Handle any errors
        error.message = "requestSaasRecs error: " + error.message + ", statusCode: " + error.statusCode;
        error.statusCode = 500;
        throw error
    }
}

module.exports = {
    requestSaasRecsAdmin,
    requestSaasRecs
}
