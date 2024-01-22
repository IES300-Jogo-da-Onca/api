/* eslint-disable linebreak-style */
/* eslint-disable import/no-extraneous-dependencies */
const mysql2 = require('mysql2');

const { Sequelize } = require('sequelize');
const User = require('./models/User');
const DB_CONFIG = require('./dbconfig');

const connection = new Sequelize(DB_CONFIG);
User.init(connection);
// eslint-disable-next-line eqeqeq
if (DB_CONFIG.dialect == 'mysql') {
  connection.query('SET time_zone = "-03:00" ');
  DB_CONFIG.dialectModule = mysql2;
}
module.exports = connection;
