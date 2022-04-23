const Router = require('express').Router
const crypto = require('crypto')
const { verificaLogin, rotaUsuarioLogado, rotaUsuarioNaoLogado } = require('./auth.js')
const router = Router()
const User = require('./models/User')

router.post('/login', rotaUsuarioNaoLogado, verificaLogin)

router.post('/register', rotaUsuarioNaoLogado, async (req, res) => {
    const { nome, senha, login } = req.body
    try {
        senhaHash = crypto.createHash('sha256').update(senha).digest('hex')
        const user = await User.create({ nome, senha: senhaHash, login })
        delete user['senha']
        res.json({
            status: 200, mensagem: 'usuario cadastrado', data: {
                id: user.id, nome: user.nome, login: user.login, ehAdmin: user.ehAdmin,
                ehPremium: user.ehPremium
            }
        })

    } catch (error) {
        if (error.name == 'SequelizeUniqueConstraintError') {
            return res.json({ status: 404, mensagem: 'usuário já existe' })
        }
        res.json({ status: 500, mensagem: error.message })
    }

})

router.get('/', rotaUsuarioLogado, (req, res) => {
    res.json({ status: 200, mensagem: 'teste requisição de rota protegida, credencias válidas', data: req.session.user })
})
module.exports = router