'use strict'
const config = require('../config')
const db = require('../utils/db')
const axios = require('axios')
const { BadRequestError, ServerError, NotFoundError } = require('../utils/errors')
const { getRowanCusdt, getAssetInfo, getDenomFromSymbol } = require('../utils/helpers')
const BigNumber = require('bignumber.js')
const logger = require('../utils/logger')
const { getPools } = require('./PoolsService')
const _ = require('lodash')

/**
 * Get details on available crypto currencies.
 * This endpoint is to provide a summary for each currency available on the exchange.
 *
 * returns List
 **/
exports.getAssets = async function () {
  try {
    const query = `select * from token_registry`
    const assets = (await db.query(query)).rows

    const xx = assets.map((a) => {
      // get array of duplicate assets without taking prefix into account
      const duplicates = assets.filter((as) => as.base_denom.substring(1) === a.base_denom.substring(1))

      // return only asset with bigger decimals
      const bigestDecimalAsset = duplicates.reduce((previous, current) => {
        return current.decimals > previous.decimals ? current : previous
      })

      const symbol = bigestDecimalAsset.base_denom === 'rowan' ? 'rowan' : bigestDecimalAsset.base_denom.substring(1)
      return {
        symbol,
        decimals: bigestDecimalAsset.decimals,
        canWithdraw: bigestDecimalAsset.is_active,
        canDeposit: bigestDecimalAsset.is_active,
      }
    })

    // filter out duplicates created by replacing smaller decimal duplicate assets with bigger decimal assets
    return _.uniqBy(xx, 'symbol')
  } catch (error) {
    logger.error(error)
    throw new ServerError()
  }
}

/**
 *
 * symbol String
 * returns GetTokenValueResponse
 **/
exports.getTokenValue = async function (symbol) {
  const denom = await getDenomFromSymbol(symbol)
  try {
    if (denom === 'rowan') {
      const rowanCusdt = await getRowanCusdt()
      return {
        symbol: 'rowan',
        priceInCUSD: rowanCusdt,
        priceInRowan: '1',
      }
    }
    const res = await axios({
      url: `${config.lcd.url}/clp/getPool`,
      params: { symbol: denom },
    })

    const { result } = res.data
    const nativeAssetBalance = BigNumber(result.pool.native_asset_balance)
    const externalAssetBalance = BigNumber(result.pool.external_asset_balance)
    //total rowans in this pool divided by rowan decimals
    const rowanUnits = nativeAssetBalance.dividedBy(10 ** 18)
    const externalAssetInfo = await getAssetInfo({ symbol: denom })

    // total tokens in this pool divided by its decimals
    const externalAssetUnits = externalAssetBalance.dividedBy(10 ** externalAssetInfo.decimals)
    const priceInRowan = rowanUnits.dividedBy(externalAssetUnits)
    const rowanCusdt = await getRowanCusdt() // get roawn/cusdt conversion rate

    const priceInUSDC = rowanUnits.dividedBy(externalAssetUnits).multipliedBy(rowanCusdt)

    return {
      symbol: symbol.toLowerCase(),
      priceInUSDC,
      priceInRowan,
    }
  } catch (error) {
    logger.error(error)
    if (error.response.status === 400) {
      throw new BadRequestError(error.response.data.error)
    }
    if (error.response.data.error === 'pool does not exist') {
      throw new NotFoundError('Token does not exist.')
    }
    throw new ServerError()
  }
}

exports.getTokenStats = async function () {
  try {
    const priceQuery = `
      select height, timestamp, rowan_cusdt, token_prices, token_volumes_24hr
      from prices_latest 
    `
    const tokenPrice = (await db.query(priceQuery)).rows[0]
    const cmcQuery = `
      select token, last_price
      from tokenprices_coinmarketcap where is_latest=true
    `
    const cmcPrices = (await db.query(cmcQuery)).rows
    const poolInfo = `
 select tr.base_denom as symbol,
         p.native_asset_bal_usd,
    p.external_asset_bal_usd,
    p.external_price_usd,
    p.native_price_usd,
    coalesce (v1.swap_fees_daily,0) as swap_fees
        from pool_info p 
        inner join token_registry tr
        on p.pool = tr.denom
        left join 
        (
        select v.asset, v.swap_fees_daily from tokenvolumes v 
        where time = (select max(time) from tokenvolumes)
        ) v1 on 
        tr.base_denom = v1.asset
        `
    const pools = (await db.query(poolInfo)).rows
    const reward_param = await axios({
      url: `${config.lcd.url}/clp/getRewardParams`,
    })
    const { height } = reward_param.data
    const { params } = reward_param.data.result
    const { reward_periods } = params
    const current_height = Number(reward_param.data.height)

    const reward_period =
      reward_periods &&
      reward_periods
        .filter(
          ({ reward_period_start_block, reward_period_end_block }) =>
            current_height >= Number(reward_period_start_block) && current_height < Number(reward_period_end_block),
        )
        .sort(
          (
            { reward_period_end_block: reward_period_end_block_a },
            { reward_period_end_block: reward_period_end_block_b },
          ) => Number(reward_period_end_block_a) - Number(reward_period_end_block_b),
        )[0]

    const accrued_num_blocks_rewards = reward_period
      ? Math.abs(
          Math.min(current_height, reward_period.reward_period_end_block) - reward_period.reward_period_start_block,
        )
      : 0

    const blocks_per_year = 10 * 60 * 24 * 365
    const tokens = Object.keys(tokenPrice.token_prices)
      .filter((tokenPairs) => tokenPairs.endsWith('_rowan'))
      .map((rowanPairs) => {
        const denom = rowanPairs.replace('_rowan', '')
        const symbol = denom.substring(1)
        const volume = tokenPrice.token_volumes_24hr[denom] || 0.0
        const priceToken = tokenPrice.token_prices[denom + '_cusdt']
        const rewardDistributed = Number(tokenPrice.token_prices[denom + '_reward_distributed'] || 0) / 1e18
        const cmcPrice = cmcPrices.find((c) => c.token === symbol.toUpperCase())
        const arb =
          cmcPrice && cmcPrice.last_price ? ((priceToken - Number(cmcPrice.last_price)) / priceToken) * 100.0 : null
        const pool = pools.find((p) => p.symbol === denom)
        const depth = pool && pool.native_asset_bal_usd ? Number(pool.native_asset_bal_usd) : null
        const swap_fees = pool && pool.swap_fees ? Number(pool.swap_fees) : 0
        const tvl =
          pool && pool.native_asset_bal_usd && pool.external_asset_bal_usd
            ? Number(pool.native_asset_bal_usd) + Number(pool.external_asset_bal_usd)
            : 0
        // const trading_apr = (swap_fees / (accrued_num_blocks_rewards * volume)) * blocks_per_year || 0

        const poolBalanceInRowan = tvl / tokenPrice.rowan_cusdt
        const reward_apr =
          (rewardDistributed / (accrued_num_blocks_rewards * poolBalanceInRowan)) * blocks_per_year || 0
        const pool_apr = /*trading_apr + */ reward_apr

        return {
          symbol,
          priceToken,
          poolDepth: depth,
          poolTVL: tvl,
          volume,
          arb,
          dailySwapFees: swap_fees,
          poolBalance: tvl,
          poolBalanceInRowan: poolBalanceInRowan,
          accruedNumBlocksRewards: accrued_num_blocks_rewards,
          rewardPeriodNativeDistributed: rewardDistributed,
          blocksPerYear: blocks_per_year,
          // tradingApr: trading_apr,
          rewardApr: reward_apr,
          poolApr: pool_apr,
        }
      })
    //   Get these values from Austin
    const remainingMiningBonus = 30000000
    const monthsLockup = 4
    const totalPoolsValueRowan = pools.reduce((a, b) => a + b.native_asset_bal_usd + b.external_asset_bal_usd, 0)
    const liquidityAPY = ((remainingMiningBonus * 1e18) / totalPoolsValueRowan) * (12.0 / monthsLockup) * 100.0

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: {
        liqAPY: liquidityAPY,
        rowanUSD: tokenPrice.rowan_cusdt,
        pools: tokens,
      },
    }
  } catch (error) {
    logger.error(error)
    throw new ServerError()
  }

  /*  try {
    const priceQuery = `
      select height, timestamp, rowan_cusdt, token_prices, token_volumes_24hr
      from prices_latest 
    `
    const tokenPrice = (await db.query(priceQuery)).rows[0]
    const cmcQuery = `
      select token, last_price
      from tokenprices_coinmarketcap where is_latest=true
    `
    const cmcPrices = (await db.query(cmcQuery)).rows
    const pools = await getPools()

    const tokens = Object.keys(tokenPrice.token_prices)
      .filter((tokenPairs) => tokenPairs.endsWith('_rowan'))
      .map((rowanPairs) => {
        const denom = rowanPairs.replace('_rowan', '')
        const symbol = denom.substring(1)
        const volume = tokenPrice.token_volumes_24hr[denom] || 0.0
        const priceToken = tokenPrice.token_prices[denom + '_cusdt']
        const cmcPrice = cmcPrices.find((c) => c.token === symbol.toUpperCase())
        const arb =
          cmcPrice && cmcPrice.last_price ? ((priceToken - Number(cmcPrice.last_price)) / priceToken) * 100.0 : null
        const pool = Number(pools.find((p) => p.externalAsset.symbol === symbol).nativeAsset.balance) / 10.0 ** 18

        return {
          symbol,
          priceToken,
          poolDepth: pool * tokenPrice.rowan_cusdt,
          volume,
          arb,
        }
      })
    //   Get these values from Austin
    const remainingMiningBonus = 30000000
    const monthsLockup = 4
    const totalPoolsValueRowan = pools.reduce((a, b) => a + b.nativeAsset.balance * 2, 0)
    const liquidityAPY = ((remainingMiningBonus * 1e18) / totalPoolsValueRowan) * (12.0 / monthsLockup) * 100.0

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: {
        liqAPY: liquidityAPY,
        rowanUSD: tokenPrice.rowan_cusdt,
        pools: tokens,
      },
    }
  } catch (error) {
    logger.error(error)
    throw new ServerError()
  }
  */
}

exports.getTokenStatsPMTP = async function () {
  try {
    const priceQuery = `
      select height, timestamp, rowan_cusdt, token_prices, token_volumes_24hr
      from prices_latest 
    `
    const tokenPrice = (await db.query(priceQuery)).rows[0]
    const cmcQuery = `
      select token, last_price
      from tokenprices_coinmarketcap where is_latest=true
    `
    const cmcPrices = (await db.query(cmcQuery)).rows
    const poolInfo = `
 select tr.base_denom as symbol,
         p.native_asset_bal_usd,
    p.external_asset_bal_usd,
    p.external_price_usd,
    p.native_price_usd,
    coalesce (v1.swap_fees_daily,0) as swap_fees
        from pool_info p 
        inner join token_registry tr
        on p.pool = tr.denom
        left join 
        (
        select v.asset, v.swap_fees_daily from tokenvolumes v 
        where time = (select max(time) from tokenvolumes)
        ) v1 on 
        tr.base_denom = v1.asset
        `
    const pools = (await db.query(poolInfo)).rows
    const reward_param = await axios({
      url: `${config.lcd.url}/clp/getRewardParams`,
    })
    const { height } = reward_param.data
    const { params } = reward_param.data.result
    const { reward_periods } = params
    const current_height = Number(reward_param.data.height)

    const reward_period =
      reward_periods &&
      reward_periods
        .filter(
          ({ reward_period_start_block, reward_period_end_block }) =>
            current_height >= Number(reward_period_start_block) && current_height < Number(reward_period_end_block),
        )
        .sort(
          (
            { reward_period_end_block: reward_period_end_block_a },
            { reward_period_end_block: reward_period_end_block_b },
          ) => Number(reward_period_end_block_a) - Number(reward_period_end_block_b),
        )[0]

    const accrued_num_blocks_rewards = reward_period
      ? Math.abs(
          Math.min(current_height, reward_period.reward_period_end_block) - reward_period.reward_period_start_block,
        )
      : 0

    const blocks_per_year = 10 * 60 * 24 * 365
    const tokens = Object.keys(tokenPrice.token_prices)
      .filter((tokenPairs) => tokenPairs.endsWith('_rowan'))
      .map((rowanPairs) => {
        const denom = rowanPairs.replace('_rowan', '')
        const symbol = denom.substring(1)
        const volume = tokenPrice.token_volumes_24hr[denom] || 0.0
        const priceToken = tokenPrice.token_prices[denom + '_cusdt']
        const rewardDistributed = Number(tokenPrice.token_prices[denom + '_reward_distributed'] || 0) / 1e18
        const cmcPrice = cmcPrices.find((c) => c.token === symbol.toUpperCase())
        const arb =
          cmcPrice && cmcPrice.last_price ? ((priceToken - Number(cmcPrice.last_price)) / priceToken) * 100.0 : null
        const pool = pools.find((p) => p.symbol === denom)
        const depth = pool && pool.native_asset_bal_usd ? Number(pool.native_asset_bal_usd) : null
        const swap_fees = pool && pool.swap_fees ? Number(pool.swap_fees) : 0
        const tvl =
          pool && pool.native_asset_bal_usd && pool.external_asset_bal_usd
            ? Number(pool.native_asset_bal_usd) + Number(pool.external_asset_bal_usd)
            : 0
        // const trading_apr = (swap_fees / (accrued_num_blocks_rewards * volume)) * blocks_per_year || 0

        const poolBalanceInRowan = tvl / tokenPrice.rowan_cusdt
        const reward_apr =
          (rewardDistributed / (accrued_num_blocks_rewards * poolBalanceInRowan)) * blocks_per_year || 0
        const pool_apr = /*trading_apr + */ reward_apr

        return {
          symbol,
          priceToken,
          poolDepth: depth,
          poolTVL: tvl,
          volume,
          arb,
          dailySwapFees: swap_fees,
          poolBalance: tvl,
          poolBalanceInRowan: poolBalanceInRowan,
          accruedNumBlocksRewards: accrued_num_blocks_rewards,
          rewardPeriodNativeDistributed: rewardDistributed,
          blocksPerYear: blocks_per_year,
          // tradingApr: trading_apr,
          rewardApr: reward_apr,
          poolApr: pool_apr,
        }
      })
    //   Get these values from Austin
    const remainingMiningBonus = 30000000
    const monthsLockup = 4
    const totalPoolsValueRowan = pools.reduce((a, b) => a + b.native_asset_bal_usd + b.external_asset_bal_usd, 0)
    const liquidityAPY = ((remainingMiningBonus * 1e18) / totalPoolsValueRowan) * (12.0 / monthsLockup) * 100.0

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: {
        liqAPY: liquidityAPY,
        rowanUSD: tokenPrice.rowan_cusdt,
        pools: tokens,
      },
    }
  } catch (error) {
    logger.error(error)
    throw new ServerError()
  }
}
