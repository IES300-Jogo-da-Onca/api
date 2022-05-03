SECRET = '123123123'
KEY = 'SSID'
const express = require('express')
const session = require('express-session')
const http = require('http');
const { Server } = require("socket.io");
const app = express()
const router = require('./rotas.js')
const db = require('./db.js')
const { getNovaSala, removerSala } = require('./utils.js')
const cookieParser = require('cookie-parser')
const cookie = cookieParser(SECRET)
const server = http.createServer(app)
const store = new session.MemoryStore()
app.use(cookie)
app.use(session({
    secret: SECRET,
    resave: true,
    saveUninitialized: false,
    store: store,
    name: KEY
}))

app.use((req, res, next) => {
    const origin = req.headers.origin?.indexOf('localhost:3000') != -1 ? "http://localhost:3000" : process.env.HOST
    res.header("Access-Control-Allow-Origin", origin);
    res.header("Access-Control-Allow-Credentials", true)
    res.header("Access-Control-Allow-Headers", "Content-Type")
    return next()
})
app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(router)
const io = new Server(server, {
    cors: {
        origin: (origin, cb) => { cb(null, true) },
        methods: ["GET", "POST"],
        credentials: true
    }
});
io.use(function (socket, next) {
    var data = socket.request;
    cookie(data, {}, function (err) {
        var sessionID = data.signedCookies[KEY];
        store.get(sessionID, function (err, session) {
            if (err || !session) {
                return next(new Error('Acesso negado!'));
            } else {
                socket.handshake.session = session;
                return next();
            }
        });
    });
})

db.authenticate()
    .then(() =>
        server.listen(process.env.PORT || 3001, () => console.log(process.env.HOST || 'http://localhost/3001')))
    .catch(console.error)

io.on('connection', socket => {
    socket.on('novaSala', () => {
        console.log(JSON.stringify(socket.handshake.session))
        novaSala = getNovaSala()
        salaAntiga = socket.handshake.session.sala
        if (salaAntiga) {
            removerSala(salaAntiga)
            socket.leave(salaAntiga)
            console.log(socket.handshake.session.user.nome + ' deixou a sala ' + salaAntiga)
        }
        socket.join(novaSala)
        console.log(socket.handshake.session.user.nome + ' entrou na sala ' + novaSala)
        socket.emit('serverNovaSala', { idSala: novaSala })
    })
})
