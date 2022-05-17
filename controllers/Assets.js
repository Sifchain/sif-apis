'use strict'

const utils = require('../utils/writer.js')
const Assets = require('../service/AssetsService')

module.exports.getAssets = function getAssets(req, res, next) {
  Assets.getAssets()
    .then(function (response) {
      utils.writeJson(res, response)
    })
    .catch(function (response) {
      utils.writeJson(res, response)
    })
}

module.exports.getTokenStats = function getTokenStats(req, res, next) {
  Assets.getTokenStats()
    .then(function (response) {
      utils.writeJson(res, response)
    })
    .catch(function (response) {
      utils.writeJson(res, response)
    })
}

module.exports.getTokenStatsPMTP = function getTokenStatsPMTP(req, res, next) {
  Assets.getTokenStatsPMTP()
    .then(function (response) {
      utils.writeJson(res, response)
    })
    .catch(function (response) {
      utils.writeJson(res, response)
    })
}

module.exports.getTokenValue = function getTokenValue(req, res, next, symbol) {
  Assets.getTokenValue(symbol)
    .then(function (response) {
      utils.writeJson(res, response)
    })
    .catch(function (response) {
      utils.writeJson(res, response)
    })
}
