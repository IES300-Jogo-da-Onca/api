
const { Sequelize } = require('sequelize')
const User = require('./models/User')
const DB_CONFIG = require('./dbconfig')

const connection = new Sequelize(DB_CONFIG)
User.init(connection)

module.exports = connection

