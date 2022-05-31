const crypto = require('crypto')
const User = require('./models/User')
const db = require('./db')
const { QueryTypes } = require('sequelize')
/**
 * verifica se as informações de login estão corretas
*/
const verificaLogin = async (req, res) => {
    const { login, senha } = req.body
    try {
        const senhaHash = await crypto.createHash('sha256').update(senha).digest('hex')

        const queryString = `
           select nomeExibicao nome, ehPremium, moedas, onca.imagemSkin skinOnca, usuario.idUsuario id,
           cachorro.imagemSkin skinCachorro, imagemTabuleiro, tabuleiro.corTematica
           from
               season inner join tabuleiro on season.idTabuleiro = tabuleiro.id
               cross join usuario
               left join skin onca on onca.id = idSkinOncaEquipada
               left join skin cachorro on cachorro.id = usuario.idSkinCachorroEquipada
           where now() between inicioVigencia and fimVigencia
           and prioridade = (select max(prioridade) max
               from season where now() between inicioVigencia and fimVigencia)
           and loginUsuario = ? and senhaUsuario = ?
        `
        const user = await db.query(queryString, {
            replacements: [login, senhaHash],
            type: QueryTypes.SELECT

        })
        if (user.length != 0) {
            req.session.user = user[0]
            return res.status(200).json({ mensagem: 'usuário logado', data: user[0] })
        }
        res.status(401).json({ mensagem: 'credenciais inválidas', data: null })

    } catch (error) {
        console.error(error)
        res.status(500).json({ mensagem: error.message, data: null })
    }
}
/**
 * retorna o status 401 se a requisição não enviar um cookie válido
*/
const rotaUsuarioLogado = (req, res, next) => {
    if (req.session && req.session.user) {
        return next()
    }
    return res.status(401).json({ mensagem: 'usuário não logado', data: null })
}

/**
 * rota acessivel apenas para usuario não logado
*/
const rotaUsuarioNaoLogado = (req, res, next) => {
    if (!req.session.user) {
        return next()
    }
    return res.status(400).json({ mensagem: 'acessivel apenas para usuario não logado', data: null })
}

module.exports = { verificaLogin, rotaUsuarioLogado, rotaUsuarioNaoLogado }