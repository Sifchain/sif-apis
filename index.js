'use strict'

require('dotenv').config()
const path = require('path')
const http = require('http')
//const mongo = require('./utils/mongo') const logger = require('./utils/logger')

const oas3Tools = require('oas3-tools')
const serverPort = 8080

// swaggerRouter configuration
const options = {
  routing: {
    controllers: path.join(__dirname, './controllers'),
  },
}

async function main() {
  try {
    //    await mongo.connect()
    console.log(process.env.DATABASE)

    const expressAppConfig = oas3Tools.expressAppConfig(path.join(__dirname, 'api/openapi.yaml'), options)
    const app = expressAppConfig.getApp()
    // Initialize the Swagger middleware
    http.createServer(app).listen(serverPort, function () {
      console.log('Your server is listening on port %d (http://localhost:%d)', serverPort, serverPort)
      console.log('Swagger-ui is available on http://localhost:%d/docs', serverPort)
    })
  } catch (error) {
    //    logger.error(error)
    // process.exit(1)
    console.log(error)
  }
}

main()
