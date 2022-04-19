const path = require('path')
const fs = require('fs')
const { Sequelize } = require('sequelize')
const CAMINHO_ARQUIVO_SQLITE = path.join(__dirname, 'db.sqlite')

if (!fs.existsSync(CAMINHO_ARQUIVO_SQLITE)) fs.writeFileSync(CAMINHO_ARQUIVO_SQLITE, '')

CONFIG_DEV = {
    dialect: 'sqlite',
    storage: CAMINHO_ARQUIVO_SQLITE
}
const connection = new Sequelize(CONFIG_DEV)

// CONFIG_PROD = {
//     host: 'db-mysql-nyc3-54219-do-user-11353914-0.b.db.ondigitalocean.com',
//     dialect: 'mysql',
//     username: 'testedb',
//     password: 'AVNS_CFghNjfrUp4RMcr',
//     database: 'testedb',
//     port: 25060,
//     ssl: true
// }
// const connection = new Sequelize(CONFIG_PROD)

module.exports = connection

