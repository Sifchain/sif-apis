const axios = require('axios')
const config = require('../config')
const _ = require('lodash')
const BigNumber = require('bignumber.js')
const db = require('./db')
// calculates the conversion rate for rowan/cusdt
exports.getRowanCusdt = async function getRowanCusdt() {
  try {
    const res = await axios({
      url: `${config.lcd.url}/clp/getPool`,
      params: { symbol: 'cusdt' },
    })

    const { result } = res.data
    const nativeAssetBalance = BigNumber(result.pool.native_asset_balance)
    const externalAssetBalance = BigNumber(result.pool.external_asset_balance)

    //total rowans in this pool divided by rowan decimals
    const rowanUnits = nativeAssetBalance.dividedBy(10 ** 18)
    const cusdtUnits = externalAssetBalance.dividedBy(10 ** 6)
    const rowanCusdt = cusdtUnits.dividedBy(rowanUnits)
    return rowanCusdt
  } catch (error) {
    throw error
  }
}

/*
returns basic asset info
{
  decimals: Number,
  imageUrl: String,
  name: String,
  network: String,
  symbol: String
}
*/

exports.getAssetInfo = async function getAssetInfo({ symbol }) {
  try {
    const res = await axios({
      url: `${config.lcd.url}/tokenregistry/entries`,
    })
    const asset = _.find(res.data.result.registry.entries, { denom: symbol })
    return asset
  } catch (error) {
    throw error
  }
}

exports.removeCPrefix = function (symbol) {
  if (symbol.toLowerCase().startsWith('u')) return symbol.toLowerCase().replace(/^u/, '')
  return symbol.toLowerCase().replace(/^c/, '')
}

exports.addCPrefix = function (symbol) {
  if (symbol.toLowerCase() === 'rowan') {
    return 'rowan'
  }

  if (symbol.startsWith('ibc')) return symbol

  return `c${symbol.toLowerCase()}`
}

exports.getDenomFromSymbol = async function (symbol) {
  const lowerCaseSymbol = symbol.toLowerCase()
  if (lowerCaseSymbol === 'rowan') {
    return 'rowan'
  }
  const query = `select denom from token_registry tr where right(tr.base_denom, -1) = $1`
  const result = await db.query(query, [lowerCaseSymbol])
  if (!result.rows[0]) {
    return null
  }
  return result.rows[0].denom
}

exports.getBaseDenomFromSymbol = async function (symbol) {
  const lowerCaseSymbol = symbol.toLowerCase()
  if (lowerCaseSymbol === 'rowan') {
    return 'rowan'
  }
  const query = `select base_denom from token_registry tr where right(tr.base_denom, -1) = $1`
  const result = await db.query(query, [lowerCaseSymbol])
  if (!result.rows[0]) {
    return null
  }
  return result.rows[0].base_denom
}

exports.removeCPrefixFromPair = function (market_pair) {
  const [base, target] = market_pair.split('_')

  return [module.exports.removeCPrefix(base), module.exports.removeCPrefix(target)].join('_')
}

exports.getIBCTokenMap = async function getIBCTokenMap(symbol) {
  if (symbol.substring(0, 4) !== 'ibc/') {
    return symbol
  }

  const query = `select * from token_registry where denom = $1`
  const denom = symbol
  const result = await db.query(query, [denom])

  return result.rows[0].base_denom
}