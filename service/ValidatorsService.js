'use strict'
const axios = require('axios')
const logger = require('../utils/logger')
const config = require('../config')
const { ServerError, BadRequestError } = require('../utils/errors')
const BigNumber = require('bignumber.js')

/**
 *
 * delegatorAddress String
 * returns GetDelegatorResponse
 **/
exports.getDelegator = async function (delegatorAddress) {
  try {
    const res = await axios({
      url: `${config.lcd.url}/staking/delegators/${delegatorAddress}/delegations`,
    })

    const { result } = res.data

    // => result
    // {
    //   height: '1340284',
    //   result: [
    //     {
    //       delegator_address: 'sif1ucvpqeq5tnmujj8k6zpufehfuvdxghfqp8yycr',
    //       validator_address: 'sifvaloper1ucvpqeq5tnmujj8k6zpufehfuvdxghfqg9vwcn',
    //       shares: '10400946502057612875259.217040085669663190',
    //       balance: { denom: 'rowan', amount: '10109720000000000010143' }
    //     }
    //   ]
    // }
    return {
      // Comment 'unknown' to refactor later
      // performance: 'unknown',
      // isSlashed: 'unknown',
      validatorAddress: result[0].delegation.validator_address, // will this be the same for all delegations?
      // validatorName: 'unknown',
      delegationTotal: result[0].balance.amount, // sum of balance
      // unclaimedRewards: 'unknown',
    }
  } catch (error) {
    logger.error(error)
    if (error.response.status === 400) {
      throw new BadRequestError(error.response.data.error)
    }

    throw new ServerError()
  }
}

/**
 *
 * validatorAddress String
 * returns GetDelegatorsResponse
 **/
exports.getDelegators = async function (validatorAddress) {
  try {
    const res = await axios({
      url: `${config.lcd.url}/cosmos/staking/v1beta1/validators/${validatorAddress}/delegations`,
    })

    const delegators = res.data.delegation_responses

    return delegators.map((d) => {
      return {
        delegatorAddress: d.delegation.delegator_address,
        delegationTotal: d.balance.amount, //in rowan
        shares: d.delegation.shares,
      }
    })
  } catch (error) {
    console.log({ error })
    if (error.response.status === 400) {
      throw new BadRequestError(error.response.data.error)
    }
    throw new ServerError()
  }
}

/**
 *
 * returns List
 **/
exports.getInactiveValidators = async function () {
  try {
    const res = await axios({
      url: `${config.lcd.url}/staking/validators?status=BOND_STATUS_UNBONDED`,
    })

    return res.data.result
  } catch (error) {
    logger.error(error)
    throw new ServerError()
  }
}

/**
 *
 * returns List
 **/
exports.getTotalStakedByDelegators = async function () {
  /*  try {
    const res = await axios({
      url: `${config.lcd.url}/cosmos/staking/v1beta1/validators`,
    })

    const amountDelegated = res.data.validators
      .filter((r) => r.status === 'BOND_STATUS_BONDED' && !r.jailed)
      .map((r) => BigNumber(r.tokens / 1e18))
      .reduce((sum, current) => sum.plus(current))
      .dividedBy(10 ** 18)
      .toString()

    return { amountDelegated }
  } catch (error) {
    logger.error(error)
    throw new ServerError()
  }
  */
  try {
    const res = await axios({
      url: `${config.lcd.url}/staking/validators?status=BOND_STATUS_BONDED`,
    })

    const amountDelegated = res.data.result
      //      .filter((r) => r.status === 'BOND_STATUS_BONDED' && !r.jailed)
      .map((r) => BigNumber(r.tokens))
      .reduce((sum, current) => sum.plus(current))
      .dividedBy(10 ** 18)
      .toString()

    return { amountDelegated }
  } catch (error) {
    logger.error(error)
    throw new ServerError()
  }
}

exports.getTotalStakedByValidators = async function () {
  try {
    const res = await axios({
      url: `${config.lcd.url}/cosmos/staking/v1beta1/validators`,
    })

    const totalStakedByValidators = res.data.validators
      .filter((r) => r.status === 'BOND_STATUS_BONDED' && !r.jailed)
      .map((r) => BigNumber(r.delegator_shares))
      .reduce((sum, current) => sum.plus(current))
      .dividedBy(10 ** 18)
      .toString()

    return { totalStakedByValidators }
  } catch (error) {
    logger.error(error)
    throw new ServerError()
  }
}

/**
 *
 * validatorAddress String
 * returns GetValidatorResponse
 **/
exports.getValidator = async function (validatorAddress) {
  try {
    const res = await axios({
      url: `${config.lcd.url}/cosmos/staking/v1beta1/validators/${validatorAddress}`,
    })

    const { validator } = res.data

    return {
      // Comment 'unknown' to refactor later
      // stakedAmount: 'unknown',
      // performance: 'unknown',
      isSlashed: validator.jailed,
      balance: validator.tokens,
      validatorAddress: validator.operator_address,
      name: validator.description.moniker,
      externalDelegation: validator.delegator_shares,
      // unclaimedRewards: 'unknown',
      selfDelegation: validator.min_self_delegation,
    }
  } catch (error) {
    logger.error(error)
    if (error.response.status === 400) {
      throw new BadRequestError(error.response.data.error)
    }
    throw new ServerError()
  }
}

/**
 *
 * returns GetValidatorsResponse
 **/
exports.getValidators = async function () {
  try {
    const res = await axios({
      url: `${config.lcd.url}/staking/validators?status=BOND_STATUS_BONDED`,
    })
    const { result } = res.data
    return (
      result
        //      .filter((v) => !v.jailed)
        .map((v) => {
          return {
            validatorAddress: v.operator_address,
            commissionRate: v.commission.commission_rates.rate,
            consensusPubkey: v.consensus_pubkey,
            status: v.status,
            tokens: v.tokens,
            delegatorShares: v.delegatorShares,
            description: v.description,
            unbondingHeight: v.unbonding_height,
            unbondingTime: v.unbonding_time,
            commission: v.commission,
            commission: {
              commissionRates: {
                rate: v.commission.commission_rates.rate,
                maxRate: v.commission.commission_rates.max_rate,
                maxChangeRate: v.commission.commission_rates.max_change_rate,
              },
              updateTime: v.commission.update_time,
            },
            minSelfDelegation: v.min_self_delegation,
          }
        })
    )
  } catch (error) {
    logger.error(error)
    throw new ServerError()
  }
}

/**
 *
 * validatorAddress String
 * amount String
 * fromAddress String
 * returns List
 **/
exports.reDelegate = function (validatorAddress, amount, fromAddress) {
  return new Promise(function (resolve, reject) {
    var examples = {}
    examples['application/json'] = [
      {
        redelegate: 'redelegate',
      },
      {
        redelegate: 'redelegate',
      },
    ]
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]])
    } else {
      resolve()
    }
  })
}

/**
 *
 * rate String
 * validatorAddress String
 * returns List
 **/
exports.setCommissionRate = function (rate, validatorAddress) {
  return new Promise(function (resolve, reject) {
    var examples = {}
    examples['application/json'] = [
      {
        amount: 0.8008281904610115,
      },
      {
        amount: 0.8008281904610115,
      },
    ]
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]])
    } else {
      resolve()
    }
  })
}

/**
 *
 * toAddress String
 * fromAddress String
 * returns List
 **/
exports.setWithdrawAddress = function (toAddress, fromAddress) {
  return new Promise(function (resolve, reject) {
    var examples = {}
    examples['application/json'] = [
      {
        withdraw: 'withdraw',
      },
      {
        withdraw: 'withdraw',
      },
    ]
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]])
    } else {
      resolve()
    }
  })
}

/**
 *
 * validatorAddress String
 * amount String
 * fromAddress String
 * returns List
 **/
exports.unDelegate = function (validatorAddress, amount, fromAddress) {
  return new Promise(function (resolve, reject) {
    var examples = {}
    examples['application/json'] = [
      {
        undelegate: 'undelegate',
      },
      {
        undelegate: 'undelegate',
      },
    ]
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]])
    } else {
      resolve()
    }
  })
}

/**
 *
 * moniker String
 * returns List
 **/
exports.unJail = function (moniker) {
  return new Promise(function (resolve, reject) {
    var examples = {}
    examples['application/json'] = [
      {
        unjail: 'unjail',
      },
      {
        unjail: 'unjail',
      },
    ]
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]])
    } else {
      resolve()
    }
  })
}

/**
 *
 * validatorAddress String
 * amount String
 * fromAddress String
 * returns List
 **/
exports.withdrawRewards = function (validatorAddress, amount, fromAddress) {
  return new Promise(function (resolve, reject) {
    var examples = {}
    examples['application/json'] = [
      {
        amount: 0.8008281904610115,
      },
      {
        amount: 0.8008281904610115,
      },
    ]
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]])
    } else {
      resolve()
    }
  })
}

/**
 *
 * validatorAddress String
 * amount String
 * fromAddress String
 * returns List
 **/
exports.addDelegation = async function (validatorAddress, amount, fromAddress) {
  try {
    const res = {
      unsigned_txn: {
        type: 'cosmos-sdk/MsgDelegate',
        value: {
          delegator_address: fromAddress,
          validator_address: validatorAddress,
          amount: amount,
        },
      },
      fee: {
        amount: 150000,
        gas: '300000',
      },
      sifnodeAddr: 'https://api-testnet.sifchain.finance',
    }
    return res
  } catch (error) {
    if (error.response.status === 400) {
      throw new BadRequestError(error.response.data.error)
    }

    throw new ServerError()
  }
}

/**
 *
 * address String
 * returns List
 **/
exports.claimAllRewards = function (address) {
  return new Promise(function (resolve, reject) {
    var examples = {}
    examples['application/json'] = [
      {
        rewards: 'rewards',
      },
      {
        rewards: 'rewards',
      },
    ]
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]])
    } else {
      resolve()
    }
  })
}
