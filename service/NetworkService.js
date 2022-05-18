'use strict'
//const { Transactions } = require('../utils/mongo').collections()
const axios = require('axios')
const config = require('../config')
const { ServerError, BadRequestError, NotFoundError } = require('../utils/errors')
var { getTotalStakedByDelegators } = require('../service/ValidatorsService')
const { getLiquidityProvider, getPool } = require('../service/PoolsService')
const { getRowanCusdt, removeCPrefix, removeCPrefixFromPair, getBaseDenomFromSymbol } = require('../utils/helpers')
const db = require('../utils/db')
const logger = require('../utils/logger')
const BigNumber = require('bignumber.js')
const _ = require('lodash')
const { getAssets } = require('./AssetsService')

exports.getDailyPrice = async function () {
  try {
    const query = `
     select trading_pairs, highest_price_24h, 
        lowest_price_24h, last_price, opening, price_change_percent_24h,
        base_currency, target_currency,
        base_volume, target_volume, bid, ask,
        liquidity_in_usd
        from trade_daily_temp
    `
    const result = await db.query(query)
    if (!result || !result.rows || !result.rows.length) return []

    return result.rows.map((r) => {
      return {
        tradingPairs: removeCPrefixFromPair(r.trading_pairs),
        baseCurrency: removeCPrefix(r.base_currency),
        targetCurrency: removeCPrefix(r.target_currency),
        lastPrice: r.last_price,
        lowestAsk: r.ask,
        highestBid: r.bid,
        baseVolume: r.base_volume,
        targetVolume: r.target_volume,
        priceChangePercent24H: r.price_change_percent_24h,
        highestPrice24H: r.highest_price_24h,
        lowestPrice24H: r.lowest_price_24h,
        liquidity_in_usd: r.liquidity_in_usd,
      }
    })
  } catch (error) {
    console.log(error)
    throw new ServerError()
  }
}
exports.getDailyPricecmc = async function () {
  try {
    const query = `
          select p.asset as tickerID, 
          left(p.asset, length(p.asset)-6) as base_currency,
          'rowan' as target_currency,
          p.last as last_price,
          b.volume as base_volume,
          t.rowan_vol as target_volume,
          p.last - p.last * 0.002 as bid,
          p.last as ask,
          p.high,
          p.low
          from (select time_bucket('1 Day', time) as daily,
            asset,
              first(asset_price, time) as opening,
              max(asset_price) as high,
              min(asset_price) as low,
              last(asset_price, time) as last
          from TokenPrices
          where 
          time > now() - interval '1 Day'
          and asset like '%_rowan'
          group by daily, asset
          ) p inner join 
          (	select time_bucket('1 Day', time) as daily, 
            last(asset_volume_daily, time) as rowan_vol from tokenvolumes where asset = 'rowan'
            group by daily
            ) t
            on p.daily = t.daily
          left join 
          ( select time_bucket('1 Day', time) as daily,
              asset,
              last(asset_volume_daily, time) as volume
            from TokenVolumes 
            where time > now() - interval '1 Day'
            and asset <> 'rowan'
            group by daily, asset
          ) b on p.daily = b.daily
          and p.asset = b.asset || '_rowan'
          order by p.daily desc
          ;
  `
    const res = await db.query(query)
    return res.rows.map((row) => {
      row.tickerid = removeCPrefixFromPair(row.tickerid)
      return row
    })
  } catch (error) {
    logger.error(error)
    if (error.response && error.response.status === 400) {
      throw new BadRequestError(error.response.data.error)
    }

    throw new ServerError()
  }
}
exports.getHistoricalPrice = async function (symbol) {
  const denom = await getBaseDenomFromSymbol(symbol)
  if (!denom || denom === 'rowan') {
    throw new NotFoundError('Pool not found.')
  }
  try {
    const query = `
      select time, asset_price as price, asset
      from tokenprices
      where asset = $1
      or asset = $2
      order by time limit 1000
      `
    // order by time desc limit 1000
    const values = [`${denom}_rowan`, `${denom}_cusdt`]
    const result = await db.query(query, values)

    if (!result || !result.rows || !result.rows.length) return []

    const groupedByDate = _.groupBy(result.rows, (x) => Date.parse(x.time))

    const getRowanPair = (p) => p.asset === `${denom}_rowan`
    const getCusdtPair = (p) => p.asset === `${denom}_cusdt`

    return (
      Object.entries(groupedByDate)
        // filter out the odd case where there is not a rowan or cusdt price
        .filter((group) => {
          return group[1].find(getRowanPair) && group[1].find(getCusdtPair)
        })
        .map((group) => {
          return {
            timestamp: Number(group[0]),
            date: new Date(Number(group[0])),
            priceInRowan: group[1].find(getRowanPair).price.toString(),
            priceInUSDC: group[1].find(getCusdtPair).price.toString(),
          }
        })
    )
  } catch (error) {
    logger.error(error)
    if (error.response && error.response.status === 400) {
      throw new BadRequestError(error.response.data.error)
    }

    throw new ServerError()
  }
}

exports.getNetworkInfo = async function () {
  try {
    // looking for totalUsers as sender/recipient in transaction events
    // const transactions = Transactions.find({}).limit(5).toArray()
    // const query = 'SELECT DISTINCT sender,recipient FROM events_audit_txn'
    // get unique users in the last 10000 transactions. Total all time users is too slow
    const query = `
      (SELECT recipient as user FROM events_audit_txn LIMIT 10000)
      UNION
      (SELECT sender FROM events_audit_txn LIMIT 10000)`
    const result = await db.query(query)

    const totalUsers = result.rows.map((u) => u.user).filter((u) => u) // filters out falsy elements

    //    const { totalStakedByValidators } = await getTotalStakedByValidators()
    const { amountDelegated } = await getTotalStakedByDelegators()
    const res = await axios({
      url: `${config.lcd.url}/minting/inflation`,
    })
    const inflationRate = res.data.result

    const totalRowanStaked = BigNumber(amountDelegated)
    const rowanCusdt = await getRowanCusdt()
    const totalUSDStaked = totalRowanStaked.multipliedBy(rowanCusdt)

    return {
      totalRowanStaked: totalRowanStaked.toString(),
      //To be refactor later
      //averageFee: 'unknown',
      totalUSDStaked: totalUSDStaked.toString(),
      delegatorMinimumBondAmount: { value: '0.000000000000000001', denotation: 'rowan' }, // ROWAN
      blockReward: inflationRate,
      averageBlockTime: { value: '5', denotation: 'seconds' },
      networkBondingTime: { value: '21', denotation: 'days' },
      validatorMinimumBondAmount: { value: '1', denotation: 'rowan' },
    }
  } catch (error) {
    logger.error(error)
    if (error.response && error.response.status === 400) {
      throw new BadRequestError(error.response.data.error)
    }

    throw new ServerError()
  }
}

exports.getDispensation = async function (type) {
  try {
    const query = `
    select address, amount from pre_distribution_v2 pdv where is_latest = 'true'
    and disp_group = $1 
    and amount > 0
      `
    // order by time desc limit 1000
    const values = [`${type}`]
    const result = await db.query(query, values)

    if (!result || !result.rows || !result.rows.length) return []

    console.log(result)

    const OutResult = {
      Output: result.rows.map((data) => {
        return {
          address: data.address,
          coins: [
            {
              denom: 'rowan',
              amount: data.amount,
            },
          ],
        }
      }),
    }

    return OutResult
  } catch (error) {
    logger.error(error)
    if (error.response && error.response.status === 400) {
      throw new BadRequestError(error.response.data.error)
    }

    throw new ServerError()
  }
}

exports.getRewardUser = async function (address) {
  try {
    let query = ''
    let result = null

    query = `
       select signer as address,
        net_liquidity_bal,
        rp.total_liquidity_balance, 
        net_percentage, rp.liquidity_pool,
        reward_program,
        rp.dispensed_rewards_total,
        rp.pending_rewards,
        rp.next_remaining_time_to_dispense,
        rp.dispensed_rewards,
        rp.symbol,
        rp.updated_time,
        rp.rowan_cusdt,
         lp.pool_balance,
        lp.pool_balance_external,
        lp.pool_balance_native
       from reward_payout rp left join liquidity_provider lp
       on rp.signer = lp.address
        where 
       rp.signer = $1
       and rp.pending_rewards >=0
        `
    const values = [`${address}`]
    result = await db.query(query, values)

    if (!result || !result.rows || !result.rows.length) return []

    const OutResult = {
      Rewards: result.rows.map((data) => {
        return {
          reward_program: data.reward_program,
          pool: data.liquidity_pool,
          token: data.symbol,
          net_liquidity_bal: data.net_liquidity_bal,
          total_liquidity_bal: data.total_liquidity_balance,
          net_percentage: data.net_percentage,
          reward_dispensed_total: data.dispensed_rewards_total,
          next_remaining_time_to_dispense: data.next_remaining_time_to_dispense,
          dispensed_rewards: data.dispensed_rewards,
          pending_rewards: data.pending_rewards,
          rowan_cusdt: data.rowan_cusdt,
          updated_time_gmt: data.updated_time,
          pool_balance_in_usd: data.pool_balance,
          pool_balance_external: data.pool_balance_external,
          pool_balance_native: data.pool_balance_native,
        }
      }),
    }

    return OutResult
  } catch (error) {
    logger.error(error)
    if (error.response && error.response.status === 400) {
      throw new BadRequestError(error.response.data.error)
    }

    throw new ServerError()
  }
}

exports.getAvailableAmount = async function (address) {
  try {
    let query = ''
    let result = null

    query = `
    select plp.height,plp.pool,plp.liquidity_provider_units,plp.pool_balance from pmtp_liquidity_provider plp
        where 
       plp.address = $1
        `
    const values = [`${address}`]
    result = await db.query(query, values)

    if (!result || !result.rows || !result.rows.length) return []

    const OutResult = {
      Rewards: result.rows.map((data) => {
        return {
          height: data.height,
          pool: data.pool,
          units: data.liquidity_provider_units,
          balance: data.pool_balance,
        }
      }),
    }

    return OutResult
  } catch (error) {
    logger.error(error)
    if (error.response && error.response.status === 400) {
      throw new BadRequestError(error.response.data.error)
    }

    throw new ServerError()
  }
}

exports.getLucaVibe = async function (address) {
  try {
    let query = ''
    let result = null

    query = `
    select plp.height,plp.pool,plp.liquidity_provider_units from pmtp_liquidity_provider plp
        where 
       plp.address = $1
        `
    const values = [`${address}`]
    result = await db.query(query, values)

    if (!result || !result.rows || !result.rows.length) return []

    const OutResult = {
      Rewards: result.rows.map((data) => {
        return {
          height: data.height,
          pool: data.pool,
          units: data.liquidity_provider_units,
          balance: data.pool_balance,
        }
      }),
    }

    return OutResult
  } catch (error) {
    logger.error(error)
    if (error.response && error.response.status === 400) {
      throw new BadRequestError(error.response.data.error)
    }

    throw new ServerError()
  }
}


exports.getRewardConfig = async function (type) {
  try {
    let query = ''
    let result = null
    if (type.toLowerCase() !== 'all') {
      query = `
            select reward_program, start_height,
            start_date at time zone 'utc' as start_date_utc, 
            end_height,
            end_date at time zone 'utc' as end_date_utc,
            tokens,
            updated,
            comment,
            apr,
            symbol,
            isactive_preflight
            from reward_setting r inner join token_registry tr on 
            r.token = tr.denom
            where reward_program = $1`
      const values = [`${type}`]
      result = await db.query(query, values)
    } else {
      query = `
            select reward_program, start_height,
            start_date at time zone 'utc' as start_date_utc, 
            end_height,
            end_date at time zone 'utc' as end_date_utc,
            tokens,
            updated,
            comment,
            apr,
            symbol,
            isactive_preflight
            from reward_setting `
      result = await db.query(query)
    }

    if (!result || !result.rows || !result.rows.length) return []

    const OutResult = {
      Rewards: result.rows.map((data) => {
        let symbols = data.symbol
        if (symbols != null) {
          symbols = symbols.split(',').map((item) => item.trim())
        }

        let tokens = data.tokens
        if (tokens != null) {
          tokens = tokens.split(',').map((item) => item.trim())
        }
        return {
          reward_program: data.reward_program,
          config: {
            start_height: data.start_height,
            end_height: data.end_height,
            start_date_utc: data.start_date_utc,
            end_date_utc: data.end_date_utc,
            tokens: tokens,
            symbol: symbols,
          },
          apr: data.apr,
          last_updated: data.updated,
          comment: data.comment,
          preflight_on: data.isactive_preflight,
        }
      }),
    }

    return OutResult
  } catch (error) {
    logger.error(error)
    if (error.response && error.response.status === 400) {
      throw new BadRequestError(error.response.data.error)
    }

    throw new ServerError()
  }
}

/**
 * Get an overview of market data for all tickers and all markets.
 * The summary endpoint is to provide an overview of market data for all tickers and all market pairs on the exchange.
 *
 * returns List
 **/
exports.getSummary = async function () {
  try {
    const query = `
    select p.asset AS trading_pairs,
    p.high as highest_price_24h,
    p.low as lowest_price_24h,
    p.last AS last_price,
    p.opening,
    cast(((p.last - p.opening)/p.opening)*100 as float) as price_change_percent_24h,
    "left"(p.asset::text, length(p.asset::text) - 6) AS base_currency,
    'rowan'::text AS target_currency,
    coalesce(b.volume,0) AS base_volume,
    coalesce(p.last * b.volume,0) as target_volume,
    p.last - p.last * 0.002::double precision AS bid,
    p.last AS ask
   FROM ( SELECT max(tokenprices."time") AS daily,
            tokenprices.asset,
            first(tokenprices.asset_price, tokenprices."time") AS opening,
            max(tokenprices.asset_price) AS high,
            min(tokenprices.asset_price) AS low,
            last(tokenprices.asset_price, tokenprices."time") AS last
           FROM tokenprices
          WHERE tokenprices."time" > (now() - '1 day'::interval) AND tokenprices.asset::text ~~ '%_rowan'::text
          GROUP BY tokenprices.asset) p
     LEFT JOIN (
          select time as daily, asset, asset_volume_daily as volume
          from tokenvolumes 
          where time = (select max(time) from tokenvolumes)
          and asset <> 'rowan'
          ) b ON p.daily = b.daily AND p.asset::text = (b.asset::text || '_rowan'::text)
    `
    const result = await db.query(query)
    if (!result || !result.rows || !result.rows.length) return []

    return result.rows.map((r) => {
      return {
        tradingPairs: removeCPrefixFromPair(r.trading_pairs),
        baseCurrency: removeCPrefix(r.base_currency),
        targetCurrency: removeCPrefix(r.target_currency),
        lastPrice: r.last_price,
        lowestAsk: r.ask,
        highestBid: r.bid,
        baseVolume: r.base_volume,
        targetVolume: r.target_volume,
        priceChangePercent24H: r.price_change_percent_24h,
        highestPrice24H: r.highest_price_24h,
        lowestPrice24H: r.lowest_price_24h,
      }
    })
  } catch (error) {
    console.log(error)
    throw new ServerError()
  }
}

exports.getCmcSummary = async function () {
  try {
    const query = `
    select p.asset AS trading_pairs,
    p.high as highest_price_24h,
    p.low as lowest_price_24h,
    p.last AS last_price,
    p.opening,
    cast(((p.last - p.opening)/p.opening)*100 as float) as price_change_percent_24h,
    "left"(p.asset::text, length(p.asset::text) - 6) AS base_currency,
    'rowan'::text AS target_currency,
    coalesce(b.volume,0) AS base_volume,
    p.last * b.volume as target_volume,
    p.last - p.last * 0.002::double precision AS bid,
    p.last AS ask
   FROM ( SELECT max(time_bucket('1 day'::interval, tokenprices."time") ) AS daily,
            tokenprices.asset,
            first(tokenprices.asset_price, tokenprices."time") AS opening,
            max(tokenprices.asset_price) AS high,
            min(tokenprices.asset_price) AS low,
            last(tokenprices.asset_price, tokenprices."time") AS last
           FROM tokenprices
          WHERE tokenprices."time" > (now() - '1 day'::interval) AND tokenprices.asset::text ~~ '%_rowan'::text
          GROUP BY tokenprices.asset) p
     LEFT JOIN ( SELECT time_bucket('1 day'::interval, tokenvolumes."time") AS daily,
            tokenvolumes.asset,
            last(tokenvolumes.asset_volume_daily, tokenvolumes."time") AS volume
           FROM tokenvolumes
          WHERE tokenvolumes."time" > (now() - '1 day'::interval) AND tokenvolumes.asset::text <> 'rowan'::text
          and tokenvolumes.asset::text<>'cusdt'::text
          GROUP BY (time_bucket('1 day'::interval, tokenvolumes."time")), tokenvolumes.asset) b ON p.daily = b.daily AND p.asset::text = (b.asset::text || '_rowan'::text)

    `
    const result = await db.query(query)
    if (!result || !result.rows || !result.rows.length) return []

    return result.rows.map((r) => {
      return {
        tradingPairs: removeCPrefixFromPair(r.trading_pairs),
        baseCurrency: removeCPrefix(r.base_currency),
        targetCurrency: removeCPrefix(r.target_currency),
        lastPrice: r.last_price,
        lowestAsk: r.ask,
        highestBid: r.bid,
        baseVolume: r.base_volume,
        targetVolume: r.target_volume,
        priceChangePercent24H: r.price_change_percent_24h,
        highestPrice24H: r.highest_price_24h,
        lowestPrice24H: r.lowest_price_24h,
      }
    })
  } catch (error) {
    console.log(error)
    throw new ServerError()
  }
}

exports.getNetChange = async function (symbol, lpAddress) {
  // This is deprecated
  //
  const rowanDenom = 1000000000000000000.0
  const usdtDenom = 10 ** 6

  const getRowanPriceUsdt = (usdtPool, assets) => {
    const usdtAmount = usdtPool.externalAsset.balance / usdtDenom
    const rowanAmount = usdtPool.nativeAsset.balance / rowanDenom

    return usdtAmount / rowanAmount
  }
  console.log(`What's up from getNetChange symbol ${symbol}`)

  const cSymbol = symbol //addCPrefix(symbol)
  try {
    const lpResponse = await getLiquidityProvider(symbol, lpAddress)

    const assets = await getAssets()

    const al_query = `
      select sum(coalesce(al_amount,0)*
      coalesce((select asset_price from tokenprices where asset = 
      case when lower(e.al_token) = 'ibc/6d717bff5537d129035bab39f593d638ba258a9f8d86fb7ecceab05b6950cc3e' then 'uakt' 
      when lower(e.al_token) = 'ibc/27394fb092d2eccd56123c74f36e4c1f926001ceada9ca97ea622b25f41e5eb2' then 'uatom' 
      when lower(e.al_token) = 'ibc/21cb41565fca19ab6613ee06b0d56e588e0dc3e53ff94ba499bb9635794a1a35' then 'udvpn'
      else lower(e.al_token) end
      ||'_cusdt' and time <= e.time order by time desc limit 1),0) + 
      coalesce (al_amount2,0)*
      coalesce ((select asset_price from tokenprices where asset =
      case when lower(e.al_token2) = 'ibc/6d717bff5537d129035bab39f593d638ba258a9f8d86fb7ecceab05b6950cc3e' then 'uakt' 
      when lower(e.al_token2) = 'ibc/27394fb092d2eccd56123c74f36e4c1f926001ceada9ca97ea622b25f41e5eb2' then 'uatom' 
      when lower(e.al_token2) = 'ibc/21cb41565fca19ab6613ee06b0d56e588e0dc3e53ff94ba499bb9635794a1a35' then 'udvpn'
      else lower(e.al_token2) end
      || '_cusdt' and time <= e.time order by time desc limit 1),0) ) as al_final
      from events_audit e where e.type = 'added_liquidity'
      and e.al_pool = $1 
      and e.al_provider = $2 
    `
    const values = [`${cSymbol}`, `${lpAddress}`]
    const al_results = await db.query(al_query, values)

    const al = parseFloat(
      al_results.rows.map((u) => {
        if (!u.al_final) {
          return 0
        }
        return u.al_final
      }),
    )

    console.log(`Total Liquidity Adds = ${al}`)

    const rm_query = `
          select sum(coalesce(rl_amount,0)* 
      coalesce((select asset_price from tokenprices where asset =
      case when lower(e.rl_token) = 'ibc/6d717bff5537d129035bab39f593d638ba258a9f8d86fb7ecceab05b6950cc3e' then 'uakt' 
      when lower(e.rl_token) = 'ibc/27394fb092d2eccd56123c74f36e4c1f926001ceada9ca97ea622b25f41e5eb2' then 'uatom' 
      when lower(e.rl_token) = 'ibc/21cb41565fca19ab6613ee06b0d56e588e0dc3e53ff94ba499bb9635794a1a35' then 'udvpn'
      else lower(e.rl_token) end
      || '_cusdt' and time <= e.time order by time desc limit 1),0) +
      coalesce (rl_amount2,0)*
      coalesce((select asset_price from tokenprices where asset =
      case when lower(e.rl_token2) = 'ibc/6d717bff5537d129035bab39f593d638ba258a9f8d86fb7ecceab05b6950cc3e' then 'uakt' 
      when lower(e.rl_token2) = 'ibc/27394fb092d2eccd56123c74f36e4c1f926001ceada9ca97ea622b25f41e5eb2' then 'uatom' 
      when lower(e.rl_token2) = 'ibc/21cb41565fca19ab6613ee06b0d56e588e0dc3e53ff94ba499bb9635794a1a35' then 'udvpn'
      else lower(e.rl_token2) end
      || '_cusdt' and time <= e.time order by time desc limit 1),0)) as rl_final
      from events_audit e where e.type = 'removed_liquidity'
      and e.rl_pool = $1
      and e.rl_provider = $2  
    `

    const rl_results = await db.query(rm_query, values)

    const rl = -parseFloat(
      rl_results.rows.map((u) => {
        if (!u.al_final) {
          return 0
        }
        return u.al_final
      }),
    )

    console.log(`Total Liquidity Removes = ${rl}`)

    const { Pool } = await getPool('usdt')
    const rowanPriceUSDT = getRowanPriceUsdt(Pool, assets)

    console.log(`Rowan Price to USDT: ${rowanPriceUSDT}`)

    const rowanBalance = parseFloat(lpResponse.nativeAsset.balance) / rowanDenom

    console.log(`rowanBalance: ${rowanBalance}`)

    const usdtTotal = al + rl
    console.log(`usdtTotal: ${usdtTotal}`)

    console.log(`Final amount: ${rowanBalance * 2 * rowanPriceUSDT - usdtTotal}`)

    return {
      netChangeUSDT: rowanBalance * 2 * rowanPriceUSDT - usdtTotal,
    }
  } catch (error) {
    logger.error(error)
    if (error.response && error.response.status === 400) {
      throw new BadRequestError(error.response.data.error)
    }

    throw new ServerError()
  }
}

exports.cmcTotalDailyVolume = async function () {
  try {
    const dailyPrices = await this.getDailyPricecmc()

    const totalDailyVolume = dailyPrices
      .map((dp) => BigNumber(dp.target_volume))
      .reduce((sum, current) => sum.plus(current))
      .toString()

    return totalDailyVolume
  } catch (error) {
    logger.error(error)

    throw new ServerError()
  }
}
