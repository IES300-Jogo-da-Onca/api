const LRU = require('lru-cache')
const TTL_SALA = 1000 * 60 * 30 // após 30 minutos a sala será apagada da memória
cache = new LRU({ ttl: TTL_SALA, max: 1000 })

const randomString = () => Math.random().toString(36).replace(/[^a-z1-9]+/g, '')

const getNovaSala = (socketId, login, pecaSelecionada = 0) => {
    try {
        let idSala = randomString()
        while (cache.get(idSala)) {
            idSala = randomString()
        }
        cache.set(idSala, JSON.stringify({
            onca: socketId,
            jogadores: 1, id: idSala, pecaSelecionada, socketId, login  // pecao: 1 cachorro, 0 onça
        }, TTL_SALA))
        inserirSalaDisponivel({ id_sala: idSala, peca_disponivel: +!pecaSelecionada, user: login })
        return idSala
    } catch (e) {
        console.error(e)
    }
}

const getSalasDisponiveis = () => {
    salas = cache.get('salasDisponiveis')
    if (salas === undefined) return []
    return JSON.parse(salas)
}

const inserirSalaDisponivel = (obj) => {
    salas = cache.get('salasDisponiveis')
    if (salas === undefined) {
        salas = [obj]
    }
    else {
        salas = JSON.parse(salas)
        salas.push(obj)
    }
    cache.set('salasDisponiveis', JSON.stringify(salas))
}

const removerSalaDisponível = (idSala) => {
    salas = cache.get('salasDisponiveis')
    if (salas === undefined) return
    salas = JSON.parse(salas)
    salas = salas.filter(sala => sala.id_sala !== idSala)
    console.log('removendo sala ', idSala)
    cache.set('salasDisponiveis', JSON.stringify(salas))
}

const salvarSala = (sala) => {
    cache.set(sala.id, JSON.stringify(sala), TTL_SALA)
}
const removerSala = (idSala) => {
    removerSalaDisponível(idSala)
    cache.delete(idSala)
}

const getSala = (idSala) => {
    sala = cache.get(idSala)
    if (!sala) return null
    return JSON.parse(sala)
}

const dist = (x1, y1, x2, y2) => {
    return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2)
}
module.exports = {
    getNovaSala, removerSala, getSala, salvarSala, dist,
    getSalasDisponiveis, removerSalaDisponível
}