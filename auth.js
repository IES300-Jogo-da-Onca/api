const crypto = require('crypto')
const User = require('./models/User')

/**
 * verifica se as informações de login estão corretas
*/
const verificaLogin = async (req, res) => {
    const { login, senha } = req.body
    try {
        const senhaHash = await crypto.createHash('sha256').update(senha).digest('hex')
        const user = await User.findOne({
            attributes: ['nome', 'id', 'login', 'ehPremium', 'ehAdmin', 'moedas'],
            where: {
                login,
                senha: senhaHash
            }
        })
        if (user) {
            req.session.user = user
            return res.status(200).json({ mensagem: 'usuário logado', data: user })
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