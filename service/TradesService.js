'use strict'
const { ServerError, BadRequestError } = require('../utils/errors')
const db = require('../utils/db')
const logger = require('../utils/logger')
const { removeCPrefix, addCPrefix } = require('../utils/helpers')
/**
 * Get recently completed trades for a given market (24 hours)
 * The trades endpoint is to return data on all recently completed trades for a given market pair.
 *
 * market_pair String A pair such as “ceth_cusdt”
 * returns List
 **/
exports.getTrades = async function (market_pair) {
  try {
    const [base, target] = market_pair.split('_')
    if (!base || !target) {
      throw new BadRequestError(
        `The "market_pair" parameter (base_target) must be seperated by an underscore e.g. ecth_rowan`,
      )
    }
    const query = `
      select
      hash,
      swap_begin_token,
      swap_final_token,
      swap_begin_amount as base_volume,
      swap_final_amount as target_volume,
      time as timestamp
      from events_audit
      where time >= NOW() - INTERVAL '24 HOURS'
      and type='swap_successful'
      and swap_begin_token=$1
      and swap_final_token=$2
      `
    const values = [addCPrefix(base), addCPrefix(target)]
    const result = await db.query(query, values)
    if (!result || !result.rows || !result.rows.length) return []

    return result.rows.map((row) => {
      return {
        tradeId: row.hash,
        timestamp: Date.parse(row.timestamp).toString(),
        targetToken: removeCPrefix(row.swap_final_token),
        targetVolume: row.target_volume.toString(),
        baseToken: removeCPrefix(row.swap_begin_token),
        baseVolume: row.base_volume.toString(),
        price: row.base_volume.toString(),
        type: 'Swap',
      }
    })
  } catch (error) {
    logger.error(error)
    if (error instanceof Error) throw error
    throw new ServerError()
  }
}

exports.getCompetitionRanks = async function (type) {
  try {
    if (type !== 'vol' && type !== 'txn' && type !== 'type' && !type.startsWith('sif')) {
      throw new BadRequestError(`The "type" parameter must be either txn or vol`)
    }

    if (type === 'type') {
      const query = `
            select n.trading_program, n.trading_type, p.winners, p.prize_pool, p.program_start, p.program_end, n.participants, 
            n.date_started_trade,
            n.date_last_traded,
            n.last_updated_height,
            n.last_updated from
            (select nt.trading_program, nt.trading_type, count(*) as participants,
      min(nt.date_started_trading) as date_started_trade,  
      max(nt.date_last_traded) as date_last_traded,
      max(nt.last_updated) as last_updated,
      max(nt.last_traded_height) as last_updated_height
      from norse_trading nt
      where is_latest = true
      group by nt.trading_program, nt.trading_type 
      ) n inner join norse_trading_program p on 
      n.trading_program = p.trading_program and n.trading_type = p.trading_type
      `
      const result = await db.query(query)
      if (!result || !result.rows || !result.rows.length) return []

      return result.rows.map((row) => {
        return {
          program: row.trading_program,
          type: row.trading_type,
          winners: row.winners,
          prize_pool: row.prize_pool,
          program_start: row.program_start,
          program_end: row.program_end,
          participants: row.participants,
          start_trading: row.date_started_trade,
          end_trading: row.date_last_traded,
          last_updated: row.last_updated,
          date_started_trading: row.date_started_trading,
          date_last_traded: row.date_started_trading,
          last_traded_height: row.last_updated_height,
        }
      })
    }

    if (type === 'txn') {
      const query = `
      select 
      ranking,
      norse_name, 
      address,
      total_vol,
      total_num_txn,
      last_updated,
      date_started_trading,
      date_last_traded,
      last_traded_height
      from norse_trading nt
      where nt.trading_type = 'txn'
      and nt.is_latest = true
      and nt.trading_program = 'ALL'
      order by ranking 
      limit 30
      `
      const result = await db.query(query)
      if (!result || !result.rows || !result.rows.length) return []

      return result.rows.map((row) => {
        return {
          rank: row.ranking,
          addr: row.address,
          volume: row.total_vol,
          txns: row.total_num_txn,
          name: row.norse_name,
          last_updated: row.last_updated,
          date_started_trading: row.date_started_trading,
          date_last_traded: row.date_started_trading,
          last_traded_height: row.last_traded_height,
          type: 'txn',
        }
      })
    }
    if (type === 'vol') {
      const query = `
      select 
      ranking,
      norse_name, 
      address,
      total_num_txn,
      total_vol,
      last_updated,
      date_started_trading,
      date_last_traded,
      last_traded_height
      from norse_trading nt
      where nt.trading_type = 'vol'
      and nt.is_latest = true
      and nt.trading_program = 'ALL'
      order by ranking 
      limit 30
      `

      const result = await db.query(query)
      if (!result || !result.rows || !result.rows.length) return []

      return result.rows.map((row) => {
        return {
          rank: row.ranking,
          addr: row.address,
          volume: row.total_vol,
          txns: row.total_num_txn,
          name: row.norse_name,
          last_updated: row.last_updated,
          date_started_trading: row.date_started_trading,
          date_last_traded: row.date_started_trading,
          last_traded_height: row.last_traded_height,
          type: 'vol',
        }
      })
    }

    if (type.startsWith('sif')) {
      const query = `
      select 
      ranking,
      norse_name, 
      address,
      total_vol,
      total_num_txn,
      last_updated,
      date_started_trading,
      date_last_traded,
      last_traded_height,
      trading_type
      from norse_trading nt
      where 
      nt.is_latest = true
      and nt.trading_program = 'ALL'
      and nt.address = $1
      order by trading_type, ranking 
      `

      const address = [`${type}`]
      const result = await db.query(query, address)
      if (!result || !result.rows || !result.rows.length) return []

      return result.rows.map((row) => {
        return {
          rank: row.ranking,
          addr: row.address,
          volume: row.total_vol,
          txns: row.total_num_txn,
          name: row.norse_name,
          last_updated: row.last_updated,
          date_started_trading: row.date_started_trading,
          date_last_traded: row.date_started_trading,
          last_traded_height: row.last_traded_height,
          type: row.trading_type,
        }
      })
    }

    //    const values = [addCPrefix(base), addCPrefix(target)]
  } catch (error) {
    logger.error(error)
    if (error instanceof Error) throw error
    throw new ServerError()
  }
}

exports.getCompetitionRanksByToken = async function (tokenstr, type) {
  try {
    if (type !== 'vol' && type !== 'txn' && !type.startsWith('sif')) {
      throw new BadRequestError(`The "type" parameter must be either txn or vol`)
    }

    const token = tokenstr.toLowerCase()
    let limit_no = 30
    if (token === 'uakt' || token === 'clina' || token === 'cratom' || token === 'cdino') {
      limit_no = 10
    }

    if (token === 'ibc/c5c8682eb9aa1313ef1b12c991adcda465b80c05733bfb2972e2005e01bce459')
      // uixo
      limit_no = 3

    if (type === 'txn') {
      const query = `
      select 
      ranking,
      norse_name, 
      address,
      total_vol,
      total_num_txn,
      last_updated,
      date_started_trading,
      date_last_traded,
      last_traded_height
      from norse_trading nt
      where nt.trading_type = 'txn'
      and nt.is_latest = true
      and lower(nt.trading_program) = $1
      order by ranking 
      limit $2
      `
      const param = [`${token}`, limit_no]
      const result = await db.query(query, param)
      if (!result || !result.rows || !result.rows.length) return []

      return result.rows.map((row) => {
        return {
          rank: row.ranking,
          addr: row.address,
          volume: row.total_vol,
          txns: row.total_num_txn,
          name: row.norse_name,
          last_updated: row.last_updated,
          date_started_trading: row.date_started_trading,
          date_last_traded: row.date_started_trading,
          last_traded_height: row.last_traded_height,
          type: 'txn',
        }
      })
    }
    if (type === 'vol') {
      const query = `
      select 
      ranking,
      norse_name, 
      address,
      total_num_txn,
      total_vol,
      last_updated,
      date_started_trading,
      date_last_traded,
      last_traded_height
      from norse_trading nt
      where nt.trading_type = 'vol'
      and nt.is_latest = true
      and lower(nt.trading_program) = $1
      order by ranking 
      limit $2
      `

      const param = [`${token}`, limit_no]
      const result = await db.query(query, param)
      if (!result || !result.rows || !result.rows.length) return []

      return result.rows.map((row) => {
        return {
          rank: row.ranking,
          addr: row.address,
          volume: row.total_vol,
          txns: row.total_num_txn,
          name: row.norse_name,
          last_updated: row.last_updated,
          date_started_trading: row.date_started_trading,
          date_last_traded: row.date_started_trading,
          last_traded_height: row.last_traded_height,
          type: 'vol',
        }
      })
    }

    if (type.startsWith('sif')) {
      const query = `
      select 
      ranking,
      norse_name, 
      address,
      total_vol,
      total_num_txn,
      last_updated,
      date_started_trading,
      date_last_traded,
      last_traded_height,
      trading_type
      from norse_trading nt
      where 
      nt.is_latest = true
      and nt.address = $1
      and nt.trading_program = $2
      order by trading_type, ranking 
      `

      const address = [`${type}`, `${token}`]
      const result = await db.query(query, address)
      if (!result || !result.rows || !result.rows.length) return []

      return result.rows.map((row) => {
        return {
          rank: row.ranking,
          addr: row.address,
          volume: row.total_vol,
          txns: row.total_num_txn,
          name: row.norse_name,
          last_updated: row.last_updated,
          date_started_trading: row.date_started_trading,
          date_last_traded: row.date_started_trading,
          last_traded_height: row.last_traded_height,
          type: row.trading_type,
        }
      })
    }

    //    const values = [addCPrefix(base), addCPrefix(target)]
  } catch (error) {
    logger.error(error)
    if (error instanceof Error) throw error
    throw new ServerError()
  }
}
