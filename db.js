const mysql = require('mysql')
const constants = require('./constants')


const pool = mysql.createConnection({
    connectionLimit: 10,
    host: constants.DB_HOST,
    user: constants.DB_USER,
    password: constants.DB_PASS,
    database: constants.DATABASE
})

module.exports = pool
