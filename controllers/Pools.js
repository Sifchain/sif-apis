'use strict'

var utils = require('../utils/writer.js')
var Pools = require('../service/PoolsService')

module.exports.addLiquidity = function addLiquidity (req, res, next, from, symbol, nativeAmount, externalAmount) {
  Pools.addLiquidity(from, symbol, nativeAmount, externalAmount)
    .then(function (response) {
      utils.writeJson(res, response)
    })
    .catch(function (response) {
      utils.writeJson(res, response)
    })
}

module.exports.createPool = function createPool (req, res, next, key, externalAssetSymbol, rowanAmount, externalAmount) {
  Pools.createPool(key, externalAssetSymbol, rowanAmount, externalAmount)
    .then(function (response) {
      utils.writeJson(res, response)
    })
    .catch(function (response) {
      utils.writeJson(res, response)
    })
}

module.exports.getLiquidityProvider = function getLiquidityProvider (req, res, next, symbol, lpAddress) {
  Pools.getLiquidityProvider(symbol, lpAddress)
    .then(function (response) {
      utils.writeJson(res, response)
    })
    .catch(function (response) {
      utils.writeJson(res, response)
    })
}

module.exports.getLiquidityProviders = function getLiquidityProviders (req, res, next, symbol) {
  Pools.getLiquidityProviders(symbol)
    .then(function (response) {
      utils.writeJson(res, response)
    })
    .catch(function (response) {
      utils.writeJson(res, response)
    })
}

module.exports.getPool = function getPool (req, res, next, symbol) {
  Pools.getPool(symbol)
    .then(function (response) {
      utils.writeJson(res, response)
    })
    .catch(function (response) {
      utils.writeJson(res, response)
    })
}

module.exports.getPoolShare = function getPoolShare (req, res, next, symbol, lpAddress) {
  Pools.getPoolShare(symbol, lpAddress)
    .then(function (response) {
      utils.writeJson(res, response)
    })
    .catch(function (response) {
      utils.writeJson(res, response)
    })
}

module.exports.getPools = function getPools (req, res, next) {
  Pools.getPools()
    .then(function (response) {
      utils.writeJson(res, response)
    })
    .catch(function (response) {
      utils.writeJson(res, response)
    })
}

module.exports.removeliquidity = function removeliquidity (req, res, next, from, symbol, wBasis, asymmetry) {
  Pools.removeliquidity(from, symbol, wBasis, asymmetry)
    .then(function (response) {
      utils.writeJson(res, response)
    })
    .catch(function (response) {
      utils.writeJson(res, response)
    })
}
