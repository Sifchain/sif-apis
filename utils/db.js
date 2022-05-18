const Pool = require('pg').Pool

const { DBUSER, DBPASSWORD, DATABASE, DBHOST, DBPORT } = process.env

const pool = new Pool({
  user: DBUSER,
  password: DBPASSWORD,
  database: DATABASE,
  host: DBHOST,
  port: DBPORT,
})

module.exports = pool
