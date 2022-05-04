SECRET = '123123123'
KEY = 'SSID'
const express = require('express')
const session = require('express-session')
const http = require('http');
const { Server } = require("socket.io");
const app = express()
const router = require('./rotas.js')
const db = require('./db.js')
const { getNovaSala, removerSala, getSala, salvarSala, dist } = require('./utils.js')
const Jogo = require('./Jogo.js')
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
        novaSala = getNovaSala(socket.id)
        salaAntiga = socket.handshake.session.sala
        if (salaAntiga) {
            removerSala(salaAntiga)
            socket.leave(salaAntiga)
            console.log(socket.handshake.session.user.nome + ' deixou a sala ' + salaAntiga)
        }
        socket.join(novaSala)
        console.log(socket.handshake.session.user.nome + ' entrou na sala ' + novaSala)
        socket.emit('serverNovaSala', { idSala: novaSala })
        socket.handshake.session.sala = novaSala
    })

    socket.on('joinSala', (idSala) => {
        try {
            sala = getSala(idSala)
            // TODO validar se o jogador está em alguma partida
            if (sala === null) {
                return socket.emit('serverJoinSala', {
                    entrouNaSala: false, mensagem: 'sala não existe'
                })
            }
            if (sala.jogadores > 1) {
                return socket.emit('serverJoinSala', {
                    entrouNaSala: false, mensagem: 'sala indisponível'
                })
            }
            sala.jogadores++
            sala.cachorro = socket.id
            salvarSala(sala)
            socket.join(idSala)
            socket.handshake.session.sala = idSala
            console.log(socket.handshake.session.user.nome + ' entrou na sala ' + novaSala)

            socket.emit('serverJoinSala', {
                entrouNaSala: true, mensagem: 'OK'
            })
            sala.dadosPartida = {
                vetorTabuleiro: Jogo.getTabuleiroInicial(),
                cachorrosCapturados: 0,
                movimento: 0,
                turnoPeca: 0 // 0 onca, 1 cachorro
            }
            //TODO recuperar as skins
            dadosCachorro = { ehCachorro: true, ...sala.dadosPartida }
            dadosOnca = { ehCachorro: false, ...sala.dadosPartida }
            socket.to(sala.onca).emit('serverIniciarJogo', dadosOnca)
            socket.emit('serverIniciarJogo', dadosCachorro)
            salvarSala(sala)
        } catch (error) {
            console.log(error)
        }

    })

    socket.on('moverPeca', data => {
        sala = getSala(socket.handshake.session.sala)
        if (!sala) {
            return socket.emit('error', { mensagem: 'sala não existe' })
        }
        if (!(sala.onca === socket.id || sala.cachorro === socket.id)) {
            return socket.emit('error', { mensagem: 'Jogador não está na partida' })
        }
        jogadorPodeMoverPeca = (
            (socket.id === sala.onca && sala.dadosPartida.turnoPeca == 0) ||
            (socket.id === sala.cachorro && sala.dadosPartida.turnoPeca == 1)
        )
        ehCachorro = sala.dadosPartida.turnoPeca == 1
        const { x, y, old_x, old_y } = data
        tabuleiro = sala.dadosPartida.vetorTabuleiro
        if (!jogadorPodeMoverPeca || !Jogo.ehMovimentoValido(x, y, old_x, old_y, tabuleiro, ehCachorro)) {
            return socket.emit('error', { mensagem: 'Movimento inválido', x, y, old_x, old_y })
        }
        novoTabuleiro = Jogo.getNovoTabuleiro(tabuleiro, x, y, old_x, old_y, ehCachorro)
        sala.dadosPartida.turnoPeca = +!sala.dadosPartida.turnoPeca
        sala.dadosPartida.movimento++
        if (dist(x, y, old_x, old_y) == 2) sala.dadosPartida.cachorrosCapturados++
        io.in(socket.handshake.session.sala).emit('serverMoverPeca', {
            novoTabuleiro,
            turnoPeca: sala.dadosPartida.turnoPeca
        })
        salvarSala(sala)
    })

})
