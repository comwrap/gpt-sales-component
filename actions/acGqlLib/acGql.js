const fetch = require('node-fetch')
const {errorResponse} = require("../utils.js");

async function callGql(gqlRequest, params, variables = {}) {

  const gqlUrl = params['ac_url']
  const requestBody = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      query: gqlRequest,
      variables: variables
    })
  }
  const response = await fetch(gqlUrl, requestBody)
  const result = response.json();
  if (result.errors) {
    throw new Error(`failed request to API. Status: ${response.status} and message: ${result}`)
  }
  return result;
}

module.exports = {
  callGql
}
