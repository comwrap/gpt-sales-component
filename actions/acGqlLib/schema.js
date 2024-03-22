const {getIntrospectionQuery, buildClientSchema} = require("graphql");
const {errorResponse} = require("./../utils.js");
const fetch = require('node-fetch')

/**
 * Return GQL schema or throw error
 *
 * @param params
 * @returns {Promise<{error: {body: {error: string}, statusCode: number}}|any>}
 */
async function getSchema(params) {
  const gqlUrl = params['ac_url']

  const introspectionQuery = getIntrospectionQuery();
  let tty = JSON.stringify({query: introspectionQuery});
  const result = await fetch(gqlUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({query: introspectionQuery}),
  });

  const schema = result.json();
  if (result.errors) {
    return errorResponse(500, 'server error' + result.errors[0].message)
  }

  return schema;
}

module.exports = {
  getSchema
}
