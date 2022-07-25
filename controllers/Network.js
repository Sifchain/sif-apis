'use strict'

var utils = require('../utils/writer.js')
var Network = require('../service/NetworkService')

module.exports.getNetworkInfo = function getNetworkInfo(req, res, next) {
  Network.getNetworkInfo()
    .then(function (response) {
      utils.writeJson(res, response)
    })
    .catch(function (response) {
      utils.writeJson(res, response)
    })
}

module.exports.getDailyPrice = function getDailyPrice(req, res, next) {
  Network.getDailyPrice()
    .then(function (response) {
      utils.writeJson(res, response)
    })
    .catch(function (response) {
      utils.writeJson(res, response)
    })
}

module.exports.getHistoricalPrice = function getHistoricalPrice(req, res, next, symbol) {
  Network.getHistoricalPrice(symbol)
    .then(function (response) {
      utils.writeJson(res, response)
    })
    .catch(function (response) {
      utils.writeJson(res, response)
    })
}

module.exports.getDispensation = function getDispensation(req, res, next, type) {
  Network.getDispensation(type)
    .then(function (response) {
      utils.writeJson(res, response)
    })
    .catch(function (response) {
      utils.writeJson(res, response)
    })
}

module.exports.getSummary = function getSummary(req, res, next, symbol) {
  Network.getSummary(symbol)
    .then(function (response) {
      utils.writeJson(res, response)
    })
    .catch(function (response) {
      utils.writeJson(res, response)
    })
}

module.exports.getCmcSummary = function getSummary(req, res, next, symbol) {
  Network.getSummary(symbol)
    .then(function (response) {
      utils.writeJson(res, response)
    })
    .catch(function (response) {
      utils.writeJson(res, response)
    })
}

module.exports.getNetChange = function getNetChange(req, res, next, symbol, lpAddress) {
  Network.getNetChange(symbol, lpAddress)
    .then(function (response) {
      utils.writeJson(res, response)
    })
    .catch(function (response) {
      utils.writeJson(res, response)
    })
}

module.exports.cmcTotalDailyVolume = function cmcTotalDailyVolume(req, res, next, symbol, lpAddress) {
  Network.cmcTotalDailyVolume(symbol, lpAddress)
    .then(function (response) {
      utils.writeJson(res, response)
    })
    .catch(function (response) {
      utils.writeJson(res, response)
    })
}

module.exports.getRewardConfig = function getRewardConfig(req, res, next, type) {
  Network.getRewardConfig(type)
    .then(function (response) {
      utils.writeJson(res, response)
    })
    .catch(function (response) {
      utils.writeJson(res, response)
    })
}

module.exports.getRewardUser = function getRewardUser(req, res, next, address) {
  Network.getRewardUser(address)
    .then(function (response) {
      utils.writeJson(res, response)
    })
    .catch(function (response) {
      utils.writeJson(res, response)
    })
  }

  module.exports.getAvailableAmount = function getAvailableAmount(req, res, next, address) {
    Network.getAvailableAmount(address)
      .then(function (response) {
        utils.writeJson(res, response)
      })
      .catch(function (response) {
        utils.writeJson(res, response)
      })
    }
  
  module.exports.getLucaVibe = function getLucaVibe(req, res, next, address) {
    Network.getLucaVibe(address)
      .then(function (response) {
        utils.writeJson(res, response)
      })
      .catch(function (response) {
        utils.writeJson(res, response)
      })
    }
  
    

module.exports.getLppdReward = function getLppdReward(req, res, next, address) {
  Network.getLppdReward(address)
    .then(function (response) {
      utils.writeJson(res, response)
    })
    .catch(function (response) {
      utils.writeJson(res, response)
    })
}