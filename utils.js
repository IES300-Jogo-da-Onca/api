const LRU = require('lru-cache')
const TTL_SALA = 1000 * 60 * 30 // após 30 minutos a sala será apagada da memória
cache = new LRU({ ttl: TTL_SALA, max: 1000 })

const randomString = () => Math.random().toString(36).replace(/[^a-z1-9]+/g, '')

const getNovaSala = (socketId) => {
    console.log('pegando nova sala')
    try {
        let idSala = randomString()
        while (cache.get(idSala)) {
            idSala = randomString()
        }
        cache.set(idSala, JSON.stringify({ jogadores: 1, id: idSala, onca: socketId }, TTL_SALA))
        return idSala
    } catch (e) {
        console.error(e)
    }
}

const salvarSala = (sala) => {
    cache.set(sala.id, JSON.stringify(sala), TTL_SALA)
}
const removerSala = (idSala) => cache.del(idSala)

const getSala = (idSala) => {
    sala = cache.get(idSala)
    if (!sala) return null
    return JSON.parse(sala)
}

const dist = (x1, y1, x2, y2) => {
    return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2)
}
module.exports = { getNovaSala, removerSala, getSala, salvarSala, dist }