'use strict';

var utils = require('../utils/writer.js');
var Peggy = require('../service/PeggyService');

module.exports.getPeggedAssets = function getPeggedAssets (req, res, next, key) {
  Peggy.getPeggedAssets(key)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.pegAssets = function pegAssets (req, res, next, key, externalAssetSymbol, externalAmount) {
  Peggy.pegAssets(key, externalAssetSymbol, externalAmount)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.unPegAssets = function unPegAssets (req, res, next, key, externalAssetSymbol, externalAmount) {
  Peggy.unPegAssets(key, externalAssetSymbol, externalAmount)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
