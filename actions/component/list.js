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
    
    let output = {}

    let componentsList = await state.get('components_list') || null
    componentsList = componentsList['value']

    output[0] = componentsList;

    let i = 1;

    for (const key in componentsList) {
      if (componentsList.hasOwnProperty(key)) {
        const uuid = componentsList[key];
        const componentInformation = await state.get('component_' + uuid) || null;
        // if (uuid !== "c108f7b8-75f1-42a2-986b-9f86af357a00") {
          // await state.delete('component_' + uuid)
        // }
        output[i] = componentInformation;
        i++;
      }
    }

    // await state.delete('components_list')
    // let newComponentsList = {}
    // newComponentsList[0] = "c108f7b8-75f1-42a2-986b-9f86af357a00"
    // await state.put('components_list', newComponentsList, { ttl: -1 })


    const response = {
      statusCode:200,
      body: output
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
