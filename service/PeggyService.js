'use strict'
const config = require('../config')
const axios = require('axios')
const { BadRequestError, ServerError } = require('../utils/errors')
const logger = require('../utils/logger')
// TODO:  Look at the block explorer code for this also.

/**
 *
 * key String
 * returns List
 **/
exports.getPeggedAssets = function (key) {
  return new Promise(function (resolve, reject) {
    var examples = {}
    examples['application/json'] = [
      {
        tokenName: 'tokenName',
        value: 0.8008281904610115,
      },
      {
        tokenName: 'tokenName',
        value: 0.8008281904610115,
      },
    ]
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]])
    } else {
      resolve()
    }
  })
}

/**
 *
 * key String
 * externalAssetSymbol String
 * externalAmount BigDecimal
 * returns List
 **/
// Incomplete
exports.pegAssets = async function (key, externalAssetSymbol, externalAmount) {
  try {

    const baseReq = {
      from: key,
      chain_id: undefined,
      account_number: undefined,
      sequence: undefined,
    }

    const res = await axios({
      url: `${config.lcd.url}/ethbridge/lock`,
      method: 'post',
      data: {
        base_req: baseReq,
        ethereum_chain_id: undefined,
        token_contract_address: undefined,
        cosmos_sender: undefined,
        ethereum_receiver: undefined,
        amount: externalAmount,
        symbol: externalAssetSymbol,
        ceth_amount: undefined,
      },
    })
    return res.data
  } catch (error) {
    logger.error(error)
    if (error.response && error.response.status === 400) {
      throw new BadRequestError(error.response.data.error)
    }
    throw new ServerError()
  }
}

/**
 *
 * key String
 * externalAssetSymbol String
 * externalAmount BigDecimal
 * returns List
 **/
// Incomplete
exports.unPegAssets = async function (key, externalAssetSymbol, externalAmount) {
  try {

    const baseReq = {
      from: key,
      chain_id: undefined,
      account_number: undefined,
      sequence: undefined,
    }

    const res = await axios({
      url: `${config.lcd.url}/ethbridge/burn`,
      method: 'post',
      data: {
        base_req: baseReq,
        ethereum_chain_id: undefined,
        token_contract_address: undefined,
        cosmos_sender: undefined,
        ethereum_receiver: undefined,
        amount: externalAmount,
        symbol: externalAssetSymbol,
        ceth_amount: undefined,
      },
    })
    return res.data
  } catch (error) {
    logger.log(error)
    if (error.response && error.response.status === 400) {
      throw new BadRequestError(error.response.data.error)
    }
    throw new ServerError()
  }
}
