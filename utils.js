const LRU = require('lru-cache')
const db = require('./db')
const { QueryTypes } = require('sequelize')
const TTL_SALA = 1000 * 60 * 30 // após 30 minutos a sala será apagada da memória
cache = new LRU({ ttl: TTL_SALA, max: 1000 })

const randomString = () => Math.random().toString(36).replace(/[^a-z1-9]+/g, '')

const getNovaSala = (socketId, user, pecaSelecionada = 0) => {
    const { nome, id } = user
    try {
        let idSala = randomString()
        while (cache.get(idSala)) {
            idSala = randomString()
        }
        cache.set(idSala, JSON.stringify({
            onca: socketId,
            jogadores: 1, id: idSala, pecaSelecionada, socketId, nome, idJogadorOnca: id  // pecao: 1 cachorro, 0 onça
        }, TTL_SALA))
        inserirSalaDisponivel({ id_sala: idSala, peca_disponivel: +!pecaSelecionada, user: nome, id_user: id })
        return idSala
    } catch (e) {
        console.error(e)
    }
}

const getSalasDisponiveis = (id_user) => {
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

const getSkinsPartida = async (idJogadorOnca, idJogadorCachorro) => {
    const query = `
        select onca.imagemSkin skinOnca, onca.corTematica corPecaOnca,
        cachorro.imagemSkin skinCachorro, cachorro.corTematica corPecaCachorro,
        tabuleiro.imagemTabuleiro skinTabuleiro
        from usuario jogadorOnca
        cross join usuario jogadorCachorro 
        cross join tabuleiro
        left join skin onca on onca.id = jogadorOnca.idSkinOncaEquipada
        left join skin cachorro on cachorro.id = jogadorCachorro.idSkinCachorroEquipada
        where 
        tabuleiro.id = (select idTabuleiro from season 
                where now() between inicioVigencia and fimVigencia 
                order by prioridade desc limit 1)
        and jogadorCachorro.idUsuario = :id_cachorro
        and jogadorOnca.idUsuario = :id_onca
   `
    try {
        result = await db.query(query, {
            replacements: { id_cachorro: idJogadorCachorro, id_onca: idJogadorOnca },
            type: QueryTypes.SELECT,
        })
        return result[0]

    } catch (error) {
        console.error(error)
    }
}
module.exports = {
    getNovaSala, removerSala, getSala, salvarSala, dist,
    getSalasDisponiveis, removerSalaDisponível, getSkinsPartida
}