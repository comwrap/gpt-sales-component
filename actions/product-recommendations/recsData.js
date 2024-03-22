const {requestSaasRecsAdmin, requestSaasRecs} = require('./recsClient.js')

async function getUnitsList(params) {
    let storeViewCode = params.storeViewCode
    if (storeViewCode === null || typeof storeViewCode == 'undefined' || storeViewCode == 'undefined' || storeViewCode == undefined) {
        throw Error('storeViewCode param must be provided')
    }

    let urlPath = '/' + params['ADOBE_SAAS_DATA_SPACE_ID'] + '/' + storeViewCode + '/units';
    return await requestSaasRecsAdmin(params, urlPath, null, 'get')
}

async function getProductFromUnit(params) {
    const requiredParams = ['storeViewCode', 'websiteCode', 'environmentId', 'unitId'];
    for (const paramName of requiredParams) {
        let paramValue = params[paramName];
        if (paramValue === null || typeof paramValue === 'undefined' || paramValue === 'undefined' || paramValue === undefined) {
            const error = new Error(`${paramName} param must be provided`);
            error.statusCode = 400;
            throw error
        }
    }

    /**
     * <option value="CMS">Home page</option>
     * <option value="Category">Category</option>
     * <option value="Product">Product detail</option><
     * option value="Cart">Cart</option>
     * <option value="Checkout">Order confirmation</option>
     * <option value="PageBuilder">Page Builder</option>
     */
    let data = {
        "environmentId": params.environmentId,
        "storeViewCode": params.storeViewCode,
        "websiteCode": params.websiteCode
    };

    let urlPath = '/preconfigured/units/' + params.unitId;
    let preconfigured = await requestSaasRecs(params, urlPath, data, 'post', true)

    let product = null;
    if (preconfigured.products && preconfigured.products.length > 0) {
        product = preconfigured.products.reduce((minProduct, currentProduct) => {
            return minProduct.rank < currentProduct.rank ? minProduct : currentProduct;//product with highest rank (low value better?)
        });
    } else {
        const error = new Error("No products found in product recommendation unit");
        error.statusCode = 400;
        throw error
    }

    return product;
}

module.exports = {
    getUnitsList,
    getProductFromUnit
}
