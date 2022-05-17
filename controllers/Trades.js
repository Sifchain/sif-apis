'use strict'

const utils = require('../utils/writer.js')
const Trades = require('../service/TradesService')

module.exports.getTrades = function getTrades(req, res, next, market_pair) {
  Trades.getTrades(market_pair)
    .then(function (response) {
      utils.writeJson(res, response)
    })
    .catch(function (response) {
      utils.writeJson(res, response)
    })
}

module.exports.getCompetitionRanks = function getCompetitionRanks(req, res, next, type) {
  Trades.getCompetitionRanks(type)
    .then(function (response) {
      utils.writeJson(res, response)
    })
    .catch(function (response) {
      utils.writeJson(res, response)
    })
}

module.exports.getCompetitionRanksByToken = function getCompetitionRanksByToken(req, res, next, token, type) {
  Trades.getCompetitionRanksByToken(token, type)
    .then(function (response) {
      utils.writeJson(res, response)
    })
    .catch(function (response) {
      utils.writeJson(res, response)
    })
}
