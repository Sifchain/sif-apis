class GenericError extends Error {
  constructor(message) {
    super(message)
    this.message = message
    this.name = 'generic_error'
  }
}

class ServerError extends Error {
  constructor(message) {
    super(message)
    this.message = message
    this.name = 'server_error'
  }
}

class BadRequestError extends Error {
  constructor(message) {
    super(message)
    this.message = message || 'The request could not be understood by the server.'
    this.name = 'bad_request'
  }
}

class UnauthorizedError extends Error {
  constructor(message) {
    super(message)
    this.message = message || 'Unauthorized.'
    this.name = 'unauthorized'
  }
}

class NotFoundError extends Error {
  constructor(message) {
    super(message)
    this.message = message
    this.name = 'not_found'
  }
}

module.exports = {
  GenericError,
  ServerError,
  BadRequestError,
  UnauthorizedError,
  NotFoundError,
}
