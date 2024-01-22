/* eslint-disable linebreak-style */
/* eslint-disable import/no-extraneous-dependencies */
const { Sequelize } = require('sequelize');
const User = require('./models/User');
const DB_CONFIG = require('./dbconfig');

const connection = new Sequelize(DB_CONFIG);
User.init(connection);
// eslint-disable-next-line eqeqeq
if (DB_CONFIG.dialect == 'mysql') {
  connection.query('SET time_zone = "-03:00" ');
}
module.exports = connection;
