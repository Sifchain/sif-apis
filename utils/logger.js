/**
 * Simple debug and non-debug logging
 */

exports.debug = function debug(...args) {
  if (process.env.NODE_ENV === 'production') {
    return
  }

  console.log('DEBUG: ', ...args)
}

exports.log = function log(...args) {
  console.log('LOG: ', ...args)
}

exports.warning = function warning(...args) {
  console.warn('WARNING: ', ...args)
}

exports.error = function error(...args) {
  console.error('ERROR: ', ...args)
}
