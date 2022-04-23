const express = require('express')
const session = require('express-session')
const router = require('./rotas.js')
const db = require('./db.js')
const app = express()


app.use((req, res, next) => {
    const origin = req.headers.origin?.indexOf('localhost:3000') != -1 ? "http://localhost:3000" : process.env.HOST
    res.header("Access-Control-Allow-Origin", origin);
    res.header("Access-Control-Allow-Credentials", true)
    res.header("Access-Control-Allow-Headers", "Content-Type")
    return next()
})
app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(session({
    secret: '123',
    resave: false,
    saveUninitialized: false,
    name: 'ssid'
}))

app.use(router)

if (db.getDialect() == 'mysql') {
    db.authenticate()
        .then(() =>
            app.listen(process.env.PORT || 3001, () => console.log(process.env.HOST)))
        .catch(console.error)
}
else {
    db.sync({ alter: true })
        .then(() => app.listen(3001, () => console.log('localhost:3001')))
        .catch(console.error)
}


