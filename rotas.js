const Router = require('express').Router
const crypto = require('crypto')
const { verificaLogin, rotaUsuarioLogado, rotaUsuarioNaoLogado } = require('./auth.js')
const router = Router()
const User = require('./models/User')
const db = require('./db')

router.post('/login', rotaUsuarioNaoLogado, verificaLogin)

router.post('/register', rotaUsuarioNaoLogado, async (req, res) => {
    const { nome, senha, login } = req.body
    try {
        senhaHash = crypto.createHash('sha256').update(senha).digest('hex')
        const user = await User.create({ nome, senha: senhaHash, login })
        res.json({
            status: 200, mensagem: 'usuario cadastrado', data: {
                id: user.id, nome: user.nome, login: user.login, ehAdmin: user.ehAdmin,
                ehPremium: user.ehPremium, moedas: user.moedas
            }
        })

    } catch (error) {
        if (error.name == 'SequelizeUniqueConstraintError') {
            return res.json({ status: 404, mensagem: 'usuário já existe' })
        }
        res.json({ status: 500, mensagem: error.message, error })
    }
})

router.get('/loja', rotaUsuarioLogado, async (req, res) => {
    const id = req.session.user.id
    let current_time
    if (db.getDialect() == 'sqlite') current_time = 'CURRENT_TIMESTAMP'
    else current_time = 'SYSDATE()'
    try {
        const queryString = `
            select valor, imagemSkin, nomeSkin, tipoPeca from venda
            join season on season.id = venda.idSeason
            join skin on skin.id = venda.id
            where ${current_time} BETWEEN season.inicioVigencia and season.fimVigencia
            and skin.ehPermanente = 0 and skin.id not in (select idSkin from compra where idUsuario = ${id})
        `
        const [results] = await db.query(queryString)
        console.log(results)
        data = results.map(item => {
            return {
                skinName: item.nomeSkin,
                skinImg: item.imagemSkin,
                precoSkin: item.valor,
                onça: item.tipoPeca == 0
            }
        })
        res.json({ status: 200, mensagem: 'OK', data })
    } catch (error) {
        console.error(error)
        res.json({ status: 500, message: error.message, data: null })
    }


})

router.post('/comprarmoeda', rotaUsuarioLogado, async (req, res) => {
    const { valor } = req.body
    const tran = await User.sequelize.transaction()
    try {
        console.log(req.session.user)
        const user = await User.findByPk(req.session.user.id, {
            attributes: ['nome', 'id', 'login', 'ehPremium', 'ehAdmin', 'moedas'],

        })
        await user.increment('moedas', { by: valor }, { transaction: tran })
        await tran.commit()
        await user.reload()
        res.status(200).json({
            message: 'OK', data: {
                id: user.id, nome: user.nome, login: user.login, ehAdmin: user.ehAdmin,
                ehPremium: user.ehPremium, moedas: user.moedas
            }
        })

    } catch (error) {
        tran.rollback()
        console.error(error)
        console.log(user.toJson())
        res.status(500).json({ message: error.message })

    }
})

router.get('/', rotaUsuarioLogado, (req, res) => {
    res.json({ status: 200, mensagem: 'teste requisição de rota protegida, credencias válidas', data: req.session.user })
})
module.exports = router