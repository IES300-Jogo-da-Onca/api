SECRET = '123123123'
KEY = 'SSID'
const express = require('express')
const session = require('express-session')
const http = require('http');
const { Server } = require("socket.io");
const app = express()
const router = require('./rotas.js')
const db = require('./db.js')
const { getNovaSala, removerSala, getSala, salvarSala, dist, getSkinsPartida,
    getSalasDisponiveis, removerSalaDisponível } = require('./utils.js')
const Jogo = require('./Jogo.js')
const cookieParser = require('cookie-parser');
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
    const origin = req.headers.origin?.indexOf('localhost') != -1 ? req.headers.origin : process.env.HOST
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
    console.log(`user ${socket.handshake.session.user.nome} conectou. socket id: ${socket.id}`)
    socket.on('novaSala', pecaSelecionada => {
        novaSala = getNovaSala(socket.id, socket.handshake.session.user, pecaSelecionada)
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
        io.emit('serverSalasDisponiveis', getSalasDisponiveis())
    })
    socket.on('disconnect', () => {
        console.log(`user ${socket.handshake.session.user.nome} desconectou`)
        if (socket.handshake.session.sala) {
            sala = getSala(socket.handshake.session.sala)
            if (sala && sala.jogadores == 2) {
                socket.leave(sala.id)
                oncaVenceu = socket.id == sala.cachorro
                emitirFimDeJogo(sala, oncaVenceu)
            }
            removerSala(socket.handshake.session.sala)
            io.emit('serverSalasDisponiveis', getSalasDisponiveis())
        }

    })
    socket.on('joinSala', async (idSala) => {
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
            if (sala.onca === undefined) {
                sala.onca = socket.id
                sala.idJogadorOnca = socket.handshake.session.user.id
            }
            else {
                sala.cachorro = socket.id
                sala.idJogadorCachorro = socket.handshake.session.user.id
            }
            socket.join(idSala)
            salvarSala(sala)
            removerSalaDisponível(idSala)
            io.emit('serverSalasDisponiveis', getSalasDisponiveis())
            socket.handshake.session.sala = idSala
            console.log(socket.handshake.session.user.nome + 'entrou na sala ' + novaSala)

            socket.emit('serverJoinSala', {
                entrouNaSala: true, mensagem: 'OK'
            })
            sala.dadosPartida = {
                vetorTabuleiro: Jogo.getTabuleiroInicial(),
                placar: 4,
                movimento: 0,
                houveCaptura: false,
                posicaoOnca: [2, 2],
                turnoPeca: 0, // 0 onca, 1 cachorro

            }
            //TODO recuperar as skins
            skins = await getSkinsPartida(sala.idJogadorOnca, sala.idJogadorCachorro)
            dadosCachorro = { ehCachorro: true, ...sala.dadosPartida, ...skins }
            dadosOnca = { ehCachorro: false, ...sala.dadosPartida, ...skins }
            io.to(sala.onca).emit('serverIniciarJogo', dadosOnca)
            io.to(sala.cachorro).emit('serverIniciarJogo', dadosCachorro)
            salvarSala(sala)
            timer(idSala, sala.dadosPartida.movimento)
        } catch (error) {
            console.log(error)
        }

    })

    socket.on('moverPeca', data => {
        timerParaJogada = true
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
        if (!jogadorPodeMoverPeca || !Jogo.ehMovimentoValido(x, y, old_x, old_y, tabuleiro, ehCachorro, sala.dadosPartida.houveCaptura)) {
            return socket.emit('error', { mensagem: 'Movimento inválido', x, y, old_x, old_y })
        }
        novoTabuleiro = Jogo.getNovoTabuleiro(tabuleiro, x, y, old_x, old_y, ehCachorro)
        sala.dadosPartida.vetorTabuleiro = novoTabuleiro
        sala.dadosPartida.turnoPeca = +!sala.dadosPartida.turnoPeca
        sala.dadosPartida.movimento++
        let houveCaptura = !ehCachorro && dist(x, y, old_x, old_y) > 1
        if (!ehCachorro) {
            sala.dadosPartida.posicaoOnca = [x, y]
        }

        if (houveCaptura) {
            sala.dadosPartida.placar++
            oncaContinuaCaptura = Jogo.getPossiveisMovimentos(x, y, false, novoTabuleiro, true)
                .some(item => dist(x, y, item[0], item[1] == 2))
            console.log(`\n\n continua captura ${oncaContinuaCaptura}\n\n`)
            if (oncaContinuaCaptura) {
                sala.dadosPartida.turnoPeca = +!sala.dadosPartida.turnoPeca
                sala.dadosPartida.movimento--
                timerParaJogada = false
            }
            else {
                houveCaptura = false
            }
        }
        sala.dadosPartida.houveCaptura = houveCaptura
        emitirMovimentoPeca(socket.handshake.session.sala, {
            novoTabuleiro,
            turnoPeca: sala.dadosPartida.turnoPeca,
            placar: sala.dadosPartida.placar,
            houveCaptura
        })
        salvarSala(sala)
        if (sala.dadosPartida.placar == 5) {
            emitirFimDeJogo(sala, true)
            removerSala(sala.id)
            return
        }
        else if (ehCachorro) {
            const { posicaoOnca } = sala.dadosPartida
            if (Jogo.getPossiveisMovimentos(posicaoOnca[0], posicaoOnca[1], false, novoTabuleiro, false).length == 0) {
                emitirFimDeJogo(sala, false)
            }
        }
        if (timerParaJogada) {
            timer(socket.handshake.session.sala, sala.dadosPartida.movimento)
        }
    })

})
const emitirMovimentoPeca = (idSala, dadosPartida) => {
    io.in(idSala).emit('serverMoverPeca', dadosPartida)
}

const emitirFimDeJogo = (sala, oncaVenceu) => {
    pecaVencedora = oncaVenceu ? 0 : 1
    io.in(sala.id).emit('serverFimDeJogo', { pecaVencedora })
}
const timer = (idSala, movimento) => {
    setTimeout(() => {
        sala = getSala(idSala)
        if (sala && sala.dadosPartida.movimento == movimento) {
            sala.dadosPartida.turnoPeca = +!sala.dadosPartida.turnoPeca
            sala.dadosPartida.houveCaptura = false
            salvarSala(sala)
            emitirMovimentoPeca(idSala, {
                novoTabuleiro: sala.dadosPartida.vetorTabuleiro,
                turnoPeca: sala.dadosPartida.turnoPeca,
                placar: sala.dadosPartida.placar,
                houveCaptura: sala.dadosPartida.houveCaptura
            })
            timer(idSala, sala.dadosPartida.movimento)
        }
    }, 10500);

}
