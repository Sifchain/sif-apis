'use strict'
const config = require('../config')
const axios = require('axios')
const { BadRequestError, ServerError, UnauthorizedError, NotFoundError } = require('../utils/errors')
const logger = require('../utils/logger')
const BigNumber = require('bignumber.js')
const { getIBCTokenMap, getDenomFromSymbol } = require('../utils/helpers')

/**
 * Add liquidity to a specified pool.
 *
 * from String
 * symbol String
 * nativeAmount String
 * externalAmount String
 * returns String
 **/
exports.addLiquidity = async function (from, symbol, nativeAmount, externalAmount) {
  try {
    /*    const res = await axios({
      url: `${config.lcd.url}/clp/addLiquidity`,
      method: 'post',
      data: {
        base_req: {
          from,
          chain_id: 'sifchain',
        },
        // ExternalAsset: symbol,
        ExternalAsset: {
          source_chain: 'sifchain',
          symbol: symbol,
          ticker: symbol,
        },
        ExternalAssetAmount: externalAmount,
        NativeAssetAmount: nativeAmount, 
        Signer: from, // are we going to use key, from, or signer. Need consistancy
      },
    })
    */
    const res = {
      data: 'NOT IMPLEMENTED',
    }
    return res.data
  } catch (error) {
    logger.error(error)
    if (error.response && error.response.status === 400) {
      throw new BadRequestError(error.response.data.error)
    }
    if (error.response && error.response.status === 401) {
      throw new UnauthorizedError(error.response.data.error)
    }
    throw new ServerError()
  }
}

/**
 * The pool to create.
 *
 * key String
 * externalAssetSymbol String
 * rowanAmount String
 * externalAmount String
 * returns String
 **/
exports.createPool = async function (key, externalAssetSymbol, rowanAmount, externalAmount) {
  try {
    /*    const res = await axios({
      url: `${config.lcd.url}/clp/createPool`,
      method: 'post',
      data: {
        ExternalAsset: externalAssetSymbol, //externalAssetSymbol or symbol?
        ExternalAssetAmount: externalAmount,
        NativeAssetAmount: rowanAmount, // nativeAmount or rowanAmount??
        Signer: key,
      },
    })
    */
    const res = {
      data: 'NOT IMPLEMENTED',
    }
    return res.data
  } catch (error) {
    if (error.response && error.response.status === 400) {
      throw new BadRequestError(error.response.data.error)
    }
    throw new ServerError()
  }
}

/**
 * Remove liquidity from a specified pool.
 *
 * from String
 * symbol String
 * wBasis String
 * asymmetry String
 * returns String
 **/
exports.removeliquidity = async function (from, symbol, wBasis, asymmetry) {
  const denom = await getDenomFromSymbol(symbol)
  try {
    const res = await axios({
      url: `${config.lcd.url}/clp/removeLiquidity`,
      method: 'post',
      data: {
        base_req: {
          from,
          chain_id: 'sifchain',
        },
        ExternalAsset: denom,
        Asymmetry: asymmetry,
        WBasisPoints: wBasis,
        Signer: from, //signer, err := sdk.AccAddressFromBech32(req.Signer)
      },
    })
    return res.data
  } catch (error) {
    if (error.response && error.response.status === 400) {
      throw new BadRequestError(error.response.data.error)
    }
    throw new ServerError()
  }
}

/**
 *
 * symbol String
 * lpAddress String
 * returns LiquidityProviderSinglePoolResponse
 **/
exports.getLiquidityProvider = async function (symbol, lpAddress) {
  const denom = await getDenomFromSymbol(symbol)
  if (!denom || denom === 'rowan') {
    throw new NotFoundError('Pool not found.')
  }
  try {
    const res = await axios({
      url: `${config.lcd.url}/clp/getLiquidityProvider`,
      params: { symbol: denom, lpAddress },
    })

    if (!res.data.result) {
      throw new NotFoundError('Liquidity provider not found.')
    }

    const { result } = res.data
    return {
      LiquidityProvider: {
        units: result.liquidity_provider.liquidity_provider_units,
        address: result.liquidity_provider.liquidity_provider_address,
      },
      externalAsset: {
        symbol: symbol,
        balance: result.external_asset_balance,
      },
      nativeAsset: {
        symbol: 'rowan',
        balance: result.native_asset_balance,
      },
      height: result.height,
    }
  } catch (error) {
    logger.error(error)
    if (error instanceof Error) throw error
    if (error.response.status === 400) {
      throw new BadRequestError(error.response.data.error)
    }
    if (error.response.data.error === 'liquidity Provider does not exist') {
      throw new NotFoundError('Liquidity provider not found.')
    }

    throw new ServerError()
  }
}

/**
 *
 * symbol String
 * returns List
 **/

exports.getLiquidityProviders = async function (symbol) {
  try {
    const denom = await getDenomFromSymbol(symbol)
    const res = await axios({
      url: `${config.lcd.url}/clp/getLpList`,
      params: {
        symbol: denom,
        // offset: 1000,
        // limit: 100,
      },
    })

    if (!res.data.result) {
      throw new NotFoundError('Pool not found.')
    }

    return res.data.result.map((l) => {
      return {
        units: l.liquidity_provider_units,
        address: l.liquidity_provider_address,
      }
    })
  } catch (error) {
    logger.error(error)
    if (error instanceof Error) throw error
    if (error.response.status === 400) {
      throw new BadRequestError(error.response.data.error)
    }
    throw new ServerError()
  }
}

/**
 *
 * symbol String
 * returns PoolResponse
 **/
exports.getPool = async function (symbol) {
  const denom = await getDenomFromSymbol(symbol)
  if (!denom || denom === 'rowan') {
    throw new NotFoundError('Pool not found.')
  }
  try {
    const res = await axios({
      url: `${config.lcd.url}/clp/getPool`,
      params: { symbol: denom },
    })
    const { result } = res.data
    return {
      Pool: {
        externalAsset: {
          symbol,
          balance: result.pool.external_asset_balance,
        },
        nativeAsset: {
          symbol: 'rowan',
          balance: result.pool.native_asset_balance,
        },
        poolUnits: result.pool.pool_units,
      },
      clpModuleAddress: result.clp_module_address,
      height: result.height,
    }
  } catch (error) {
    logger.error(error)
    if (error.response.status === 400) {
      throw new BadRequestError(error.response.data.error)
    }
    if (error.response.data.error === 'pool does not exist') {
      throw new NotFoundError('Pool not found.')
    }
    throw new ServerError()
  }
}

/**
 *
 * symbol String
 * lpAddress String
 * returns PoolShareResponse
 *
 **/
exports.getPoolShare = async function (symbol, lpAddress) {
  const denom = await getDenomFromSymbol(symbol)
  if (!denom || denom === 'rowan') {
    throw new NotFoundError('Pool not found.')
  }
  try {
    const lpPromise = axios({
      url: `${config.lcd.url}/clp/getLiquidityProvider`,
      params: { symbol: denom, lpAddress },
    })
    const poolPromise = axios({
      url: `${config.lcd.url}/clp/getPool`,
      params: { symbol: denom },
    })
    const [lpRes, poolRes] = await Promise.all([lpPromise, poolPromise])

    if (!lpRes.data) {
      throw new NotFoundError('Liquidity provider not found.')
    }

    const liquidityProviderUnits = BigNumber(lpRes.data.result.liquidity_provider.liquidity_provider_units)

    const poolUnits = BigNumber(poolRes.data.result.pool.pool_units)

    // poolShare should be 0 if poolUnits and liquidityProviderUnits are zero
    if (poolUnits.isEqualTo(0) && liquidityProviderUnits.isEqualTo(0)) {
      return { poolShare: '0' }
    }
    // if poolUnits is zero and lpUnits is not zero then liquidity provider owns 100% of pool
    if (poolUnits.isEqualTo(0)) {
      return { poolShare: '1' }
    }

    const poolShare = liquidityProviderUnits.dividedBy(poolUnits)
    return { poolShare }
  } catch (error) {
    logger.error(error)
    if (error instanceof Error) throw error
    if (error.response && error.response.status === 400) {
      throw new BadRequestError(error.response.data.error)
    }
    if (error.response.data.error === 'pool does not exist') {
      throw new NotFoundError('Pool not found.')
    }

    if (error.response.data.error === 'liquidity Provider does not exist') {
      throw new NotFoundError('Liquidity provider not found.')
    }

    throw new ServerError()
  }
}

/**
 *
 * returns List
 **/
exports.getPools = async function () {
  try {
    const res = await axios({
      url: `${config.lcd.url}/clp/getPools`,
    })

    const pools = res.data.result.pools.map((p) => {
      return new Promise((resolve, reject) => {
        return getIBCTokenMap(p.external_asset.symbol)
          .then((baseDenom) => {
            resolve({
              externalAsset: {
                symbol: baseDenom.substring(1),
                balance: p.external_asset_balance,
              },
              nativeAsset: {
                symbol: 'rowan',
                balance: p.native_asset_balance,
              },
              poolUnits: p.pool_units,
            })
          })
          .catch((err) => {
            logger.error('getPools : ' + err)
            reject(err)
          })
      })
    })

    return await Promise.all(pools)
  } catch (error) {
    logger.error(error)
    if (error.response.status === 400) {
      throw new BadRequestError(error.response.data.error)
    }
    throw new ServerError()
  }
}
