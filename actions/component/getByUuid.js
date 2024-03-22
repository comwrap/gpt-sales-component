const { v4: uuidv4 } = require('uuid');
const fetch = require('node-fetch')
const { Core } = require('@adobe/aio-sdk')
const stateLib = require('@adobe/aio-lib-state')
//const { errorResponse, getBearerToken, stringParameters, checkMissingRequestInputs } = require('./../utils.js')

async function main (params) {
  // create a Logger
  const logger = Core.Logger('main', { level: params.LOG_LEVEL || 'info' })

  try {

    const parts = params.__ow_path.split('/');
    const uuid = parts.pop();


    const state = await stateLib.init()
    
    const componentInformation = await state.get('component_' + uuid) || null;

    const response = {
      statusCode:200,
      body: componentInformation
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
