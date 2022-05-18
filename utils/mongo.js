const MongoClient = require('mongodb').MongoClient
const config = require('../config')
const logger = require('../utils/logger')
const _ = require('lodash')

let collections = {}

exports.collections = function () {
  if (_.isEmpty(collections)) {
    throw new Error('MongoDB not connected.')
  }
  return collections
}

exports.connect = async function () {
  try {
    client = await MongoClient.connect(config.mongo.url)
    logger.log('Connection to MongoDB successful.')
    
    const db = client.db('block_explorer')
    
    collections.Analytics = db.collection('analytics')
    collections.AverageData = db.collection('average_data')
    collections.ChainStates = db.collection('chain_states')
    collections.Transactions = db.collection('transactions')
    
  } catch (error) {
    throw new Error(error)
  }
}
