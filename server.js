const express = require('express')
const session = require('express-session')
const cors = require('cors')
const router = require('./rotas.js')
const User = require('./models/User')
const db = require('./db.js')
const app = express()

app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(cors({
    origin: ["http://localhost:3000"],
    methods: ["GET", "POST"],
    credentials: true
}))
app.use(session({
    secret: '123',
    resave: false,
    saveUninitialized: false,
    name: 'ssid'
}))

if (db.getDialect() == 'mysql') {
    db.authenticate()
        .then(() =>
            app.listen(3001, () => console.log('localhost:3001')))
        .catch(console.error)
}
else {
    db.sync({ alter: true }).then(
        Promise.all([User.init(db)])
            .then(() => app.listen(3001, () => console.log('localhost:3001')))
            .catch(console.error)
    ).catch(console.error)

}


