'use strict'

var utils = require('../utils/writer.js')
var Stats = require('../service/StatsService')

module.exports.cmcCirculatingSupply = function cmcCirculatingSupply(req, res, next) {
  Stats.cmcCirculatingSupply()
    .then(function (response) {
      utils.writeJson(res, response)
    })
    .catch(function (response) {
      utils.writeJson(res, response)
    })
}

module.exports.cmcTotalSupply = function cmcTotalSupply(req, res, next) {
  Stats.cmcTotalSupply()
    .then(function (response) {
      utils.writeJson(res, response)
    })
    .catch(function (response) {
      utils.writeJson(res, response)
    })
}

module.exports.getCirculatingSupply = function getCirculatingSupply(req, res, next) {
  Stats.getCirculatingSupply()
    .then(function (response) {
      utils.writeJson(res, response)
    })
    .catch(function (response) {
      utils.writeJson(res, response)
    })
}

module.exports.getStakingRewards = function getStakingRewards(req, res, next) {
  Stats.getStakingRewards()
    .then(function (response) {
      utils.writeJson(res, response)
    })
    .catch(function (response) {
      utils.writeJson(res, response)
    })
}

module.exports.getTotalSupply = function getTotalSupply(req, res, next) {
  Stats.getTotalSupply()
    .then(function (response) {
      utils.writeJson(res, response)
    })
    .catch(function (response) {
      utils.writeJson(res, response)
    })
}
