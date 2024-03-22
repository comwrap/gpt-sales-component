const {callMeshGql} = require("./acGql.js");

async function queryProducts (gqlRequest, params, variables = {}) {
  let products = await callGql(gqlRequest, params, variables = {})
  return products
}

module.exports = {
  queryProducts
}
