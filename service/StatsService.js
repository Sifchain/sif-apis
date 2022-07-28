'use strict'
const config = require('../config')
const axios = require('axios')
const { ServerError } = require('../utils/errors')
const logger = require('../utils/logger')
const Web3EthContract = require('web3-eth-contract')
// Set provider for all later instances to use
Web3EthContract.setProvider(config.infura.url)
const smartContract = new Web3EthContract(JSON.parse(config.eRowan.abi), config.eRowan.contractAddress)
const { getValidator, getTotalStakedByDelegators } = require('./ValidatorsService')

/**
 *
 * symbol String
 * returns List
 **/

let totalSupplyCache = {
  amount: '0',
  timestamp: 0,
}

exports.getTotalSupply = async function () {
  // Use cached total supply amount if getTotalSupply has been cached within one minute.
  // --which is under our infura daily threshold limit.
  if (Date.now() < totalSupplyCache.timestamp + 1000 * 60) {
    logger.log('Return cached total supply: ', totalSupplyCache)
    return { amount: totalSupplyCache.amount, denom: 'rowan' }
  }
  try {
    const lcdPromise = axios(`https://api.sifchain.finance/cosmos/bank/v1beta1/supply?pagination.key=cm93YW4=`) //`${config.lcd.url}/cosmos/bank/v1beta1/supply`)
    const totalERowanPromise = smartContract.methods.totalSupply().call()
    const bridgeBankPromise = axios(`${config.lcd.url}/bank/balances/${config.bridgeBankAddress}`)
    const [lcdRes, totalERowan, bridgeBankRes] = await Promise.all([lcdPromise, totalERowanPromise, bridgeBankPromise])

    const lcdTotalSupply = lcdRes.data.supply.find((supply) => supply.denom === 'rowan').amount
    const bridgeBankAmount = bridgeBankRes.data.result.find((coin) => coin.denom === 'rowan').amount
    const totalSupply = BigInt(lcdTotalSupply) - BigInt(bridgeBankAmount) + BigInt(totalERowan)

    // update cache
    totalSupplyCache.amount = totalSupply.toString()
    totalSupplyCache.timestamp = Date.now()

    return { amount: totalSupply.toString(), denom: 'rowan' }
  } catch (error) {
    logger.error(error)
    throw new ServerError()
  }
}

exports.cmcTotalSupply = async function () {
  const amount = (await this.getTotalSupply()).amount / 1e18
  return amount.toString()
}

exports.getCirculatingSupply = async function () {
  try {
    const totalRowanSupply = await this.getTotalSupply()
    console.log(totalRowanSupply, 'lololol')
    const girlValidatorPromises = config.girls.map((girl) => getValidator(girl.validatorAddress))
    const girlValidators = await Promise.all(girlValidatorPromises)
    const totalGirlValidatorBalances = girlValidators
      .map((girl) => BigInt(girl.balance))
      .reduce((sum, current) => sum + current)

    const genesisAccountRes = await axios({ 
        url: `${config.lcd.url}/bank/balances/${config.genesisAccount}`,  
      })  
    const newGenesisAccountRes = await axios({  
        url: `${config.lcd.url}/bank/balances/${config.genesisAccountNew}`, 
      })  
    const newNewGenesisAccountRes = await axios({ 
        url: `${config.lcd.url}/bank/balances/${config.genesisAccountNewNew}`,  
      })      
    var genesisAccountAmount = 0
    var newGenesisAccountAmount = 0
    var newNewGenesisAccountAmount = 0
      
    try { 
      genesisAccountAmount = genesisAccountRes.data.result.find((coin) => coin.denom === 'rowan').amount  
    } catch (error) { 
      genesisAccountAmount = 0  
    } 
    try { 
      newGenesisAccountAmount = newGenesisAccountRes.data.result.find((coin) => coin.denom === 'rowan').amount  
    } catch (err) { 
      newGenesisAccountAmount = 0 
    } 
    try { 
      newNewGenesisAccountAmount = newNewGenesisAccountRes.data.result.find((coin) => coin.denom === 'rowan').amount  
    } catch (err) { 
      newNewGenesisAccountAmount = 0  
    } 

    const circulatingSupply =
      BigInt(totalRowanSupply.amount) - (totalGirlValidatorBalances +BigInt(newGenesisAccountAmount) +
      BigInt(genesisAccountAmount) + BigInt(genesisAccountAmount))
    

    return { amount: circulatingSupply.toString(), denom: 'rowan' }
  } catch (error) {
    logger.error(error)
    throw new ServerError()
  }
}

exports.cmcCirculatingSupply = async function () {
  const amount = (await this.getCirculatingSupply()).amount / 1e18
  return amount.toString()
}

exports.getStakingRewards = async function () {
  try {
    const res = await axios({
      url: `${config.lcd.url}/minting/inflation`,
    })
    const totalSupply = (await this.getTotalSupply()).amount / 1e18
    const { amountDelegated } = await getTotalStakedByDelegators()
    const inflationRate = res.data.result
    const result = (inflationRate * totalSupply) / amountDelegated

    return {
      rate: result,
    }
  } catch (error) {
    logger.error(error)
    throw new ServerError()
  }
}

