const { v4: uuidv4 } = require('uuid');
const fetch = require('node-fetch')
const { Core } = require('@adobe/aio-sdk')
const stateLib = require('@adobe/aio-lib-state')
//const { errorResponse, getBearerToken, stringParameters, checkMissingRequestInputs } = require('./../utils.js')

async function main (params) {
  // create a Logger
  const logger = Core.Logger('main', { level: params.LOG_LEVEL || 'info' })

  try {

    const state = await stateLib.init()

    let uuid = uuidv4()
    if (params.uuid) {
      uuid = params.uuid
    } else {

      const componentsList = await state.get('components_list') || {"value": {}}
      const newComponentsList = componentsList['value']

      if (Object.keys(newComponentsList).length === 0) {
        newComponentsList[0] = uuid
      } else {
        let maxIndex = Object.keys(newComponentsList).reduce((acc, cur) => {
          const index = parseInt(cur);
          if (!isNaN(index) && index > acc) {
            return index;
          }
          return acc;
        }, -1);
        newComponentsList[maxIndex + 1] = uuid
      }
      /**
       * Re-save feeds list
       */
      await state.put('components_list', newComponentsList, { ttl: -1 })
    
    }
    
    // /**
    //  * Save Feed data to own value
    //  */
    params['component'] = {}
    params['component'].uuid = uuid
    params['component'].created_at = new Date()
    params['component'].generated_at = ""
    params['component'].status = "pending"

    let componentConfiguration = {}
    componentConfiguration.content_type_uid = params.content_type_uid
    componentConfiguration.delivery_content = params.delivery_content
    componentConfiguration.sales_target = params.sales_target
    componentConfiguration.enable_auto_validation = params.enable_auto_validation
    componentConfiguration.enable_auto_switch = params.enable_auto_switch
    componentConfiguration.product_recommendations_unit = params.product_recommendations_unit
    componentConfiguration.store_code = params.store_code //magento store code associated with product recommendation unit
    componentConfiguration.sku = params.sku //todo: get next product when sales_target goal was reach

    params['component'].configuration = componentConfiguration

    await state.put('component_' + uuid, params['component'], { ttl: -1 })

    // params['feed'].uuid = uuid

    const componentsList = await state.get('components_list')
    const componentInfo = await state.get('component_' + uuid);

    const response = {
      statusCode: 200,
      body: componentInfo
    }
    return response
  } catch (error) {

    const response = {
      statusCode: 500,
      body: error
    }
    return response
  }
  
}

exports.main = main
