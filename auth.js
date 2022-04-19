const crypto = require('crypto')
const User = require('./models/User')

/**
 * verifica se as informações de login estão corretas
*/
const verificaLogin = async (req, res) => {
    const { login, senha } = req.body
    const senhaHash = await crypto.createHash('sha256').update(senha).digest('hex')
    try {
        const user = await User.findOne({
            attributes: ['nome', 'id', 'login', 'ehPremium', 'ehAdmin'],
            where: {
                login,
                senha: senhaHash
            }
        })
        if (user) {
            req.session.user = user
            return res.json({ status: 200, mensagem: 'usuário logado', data: user })
        }
        res.json({ status: 401, mensagem: 'credenciais inválidas', data: null })

    } catch (error) {
        console.error(error)
    }
}
/**
 * retorna o status 401 se a requisição não enviar um cookie válido
*/
const rotaUsuarioLogado = (req, res, next) => {
    if (req.session.user) {
        return next()
    }
    return res.json({ status: 401, mensagem: 'usuário não logado', data: null })
}


module.exports = { verificaLogin, rotaUsuarioLogado }