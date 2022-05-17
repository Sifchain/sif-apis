'use strict'

var utils = require('../utils/writer.js')
var Validators = require('../service/ValidatorsService')

module.exports.addDelegation = function addDelegation(req, res, next, validatorAddress, amount, fromAddress) {
  Validators.addDelegation(validatorAddress, amount, fromAddress)
    .then(function (response) {
      utils.writeJson(res, response)
    })
    .catch(function (response) {
      utils.writeJson(res, response)
    })
}

module.exports.claimAllRewards = function claimAllRewards(req, res, next, address) {
  Validators.claimAllRewards(address)
    .then(function (response) {
      utils.writeJson(res, response)
    })
    .catch(function (response) {
      utils.writeJson(res, response)
    })
}

module.exports.getDelegator = function getDelegator(req, res, next, delegatorAddress) {
  Validators.getDelegator(delegatorAddress)
    .then(function (response) {
      utils.writeJson(res, response)
    })
    .catch(function (response) {
      utils.writeJson(res, response)
    })
}

module.exports.getDelegators = function getDelegators(req, res, next, validatorAddress) {
  Validators.getDelegators(validatorAddress)
    .then(function (response) {
      utils.writeJson(res, response)
    })
    .catch(function (response) {
      utils.writeJson(res, response)
    })
}

module.exports.getInactiveValidators = function getInactiveValidators(req, res, next) {
  Validators.getInactiveValidators()
    .then(function (response) {
      utils.writeJson(res, response)
    })
    .catch(function (response) {
      utils.writeJson(res, response)
    })
}

module.exports.getTotalStakedByDelegators = function getTotalStakedByDelegators(req, res, next) {
  Validators.getTotalStakedByDelegators()
    .then(function (response) {
      utils.writeJson(res, response)
    })
    .catch(function (response) {
      utils.writeJson(res, response)
    })
}

module.exports.getValidator = function getValidator(req, res, next, validatorAddress) {
  Validators.getValidator(validatorAddress)
    .then(function (response) {
      utils.writeJson(res, response)
    })
    .catch(function (response) {
      utils.writeJson(res, response)
    })
}

module.exports.getValidators = function getValidators(req, res, next) {
  Validators.getValidators()
    .then(function (response) {
      utils.writeJson(res, response)
    })
    .catch(function (response) {
      utils.writeJson(res, response)
    })
}

module.exports.reDelegate = function reDelegate(req, res, next, validatorAddress, amount, fromAddress) {
  Validators.reDelegate(validatorAddress, amount, fromAddress)
    .then(function (response) {
      utils.writeJson(res, response)
    })
    .catch(function (response) {
      utils.writeJson(res, response)
    })
}

module.exports.setCommissionRate = function setCommissionRate(req, res, next, rate, validatorAddress) {
  Validators.setCommissionRate(rate, validatorAddress)
    .then(function (response) {
      utils.writeJson(res, response)
    })
    .catch(function (response) {
      utils.writeJson(res, response)
    })
}

module.exports.setWithdrawAddress = function setWithdrawAddress(req, res, next, toAddress, fromAddress) {
  Validators.setWithdrawAddress(toAddress, fromAddress)
    .then(function (response) {
      utils.writeJson(res, response)
    })
    .catch(function (response) {
      utils.writeJson(res, response)
    })
}

module.exports.unDelegate = function unDelegate(req, res, next, validatorAddress, amount, fromAddress) {
  Validators.unDelegate(validatorAddress, amount, fromAddress)
    .then(function (response) {
      utils.writeJson(res, response)
    })
    .catch(function (response) {
      utils.writeJson(res, response)
    })
}

module.exports.unJail = function unJail(req, res, next, moniker) {
  Validators.unJail(moniker)
    .then(function (response) {
      utils.writeJson(res, response)
    })
    .catch(function (response) {
      utils.writeJson(res, response)
    })
}

module.exports.withdrawRewards = function withdrawRewards(req, res, next, validatorAddress, amount, fromAddress) {
  Validators.withdrawRewards(validatorAddress, amount, fromAddress)
    .then(function (response) {
      utils.writeJson(res, response)
    })
    .catch(function (response) {
      utils.writeJson(res, response)
    })
}
