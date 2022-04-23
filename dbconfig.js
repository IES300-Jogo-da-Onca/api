const path = require('path')
const fs = require('fs')

const CAMINHO_ARQUIVO_SQLITE = path.join(__dirname, 'db.sqlite')
if (process.env.NODE_ENV !== 'production' && !fs.existsSync(CAMINHO_ARQUIVO_SQLITE)) {
    fs.writeFileSync(CAMINHO_ARQUIVO_SQLITE, '')
}

CONFIG_DEV = {
    dialect: 'sqlite',
    storage: CAMINHO_ARQUIVO_SQLITE
}

CONFIG_PROD = {
    host: process.env.DB_HOST,
    dialect: 'mysql',
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    ssl: true,
    logging: false
}

module.exports = process.env.NODE_ENV == 'production' ? CONFIG_PROD : CONFIG_DEV 