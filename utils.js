const cache = require('memory-cache')
const TTL_SALA = 1000 * 60 * 30 // após 30 minutos a sala será apagada da memória

const randomString = () => Math.random().toString(36).replace(/[^a-z1-9]+/g, '')

const getNovaSala = () => {
    try {
        let idSala = randomString()
        while (cache.get(idSala) !== null) {
            idSala = randomString()
        }
        cache.put(idSala, JSON.stringify({ jogadores: 1 }, TTL_SALA))
        return idSala
    } catch (e) {
        console.error(e)
    }
}

const removerSala = (idSala) => cache.del(idSala)


module.exports = { getNovaSala, removerSala }