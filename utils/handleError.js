const logger = require('../utils/logger')

exports.handleError = function (error) {
  if (error instanceof Error) {
    logger.error(error)
    // serialize error
    const serializedError = Object.getOwnPropertyNames(error).reduce((accumulator, key) => {
      accumulator[key] = error[key]
      return accumulator
    }, {})
    // remove stack trace
    delete serializedError.stack

    return { error: serializedError }
  }

  return { error: { name: 'server_error' } }
}
