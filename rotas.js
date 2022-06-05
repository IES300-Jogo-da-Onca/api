const express = require('express')
const crypto = require('crypto')
const { verificaLogin, rotaUsuarioLogado, rotaUsuarioNaoLogado } = require('./auth.js')
const router = express.Router()
const User = require('./models/User')
const db = require('./db')
const { QueryTypes } = require('sequelize')
const { getSalasDisponiveis } = require('./utils.js')

router.post('/login', rotaUsuarioNaoLogado, verificaLogin)

router.post('/register', rotaUsuarioNaoLogado, async (req, res) => {
    const { nome, senha, login } = req.body
    try {
        senhaHash = crypto.createHash('sha256').update(senha).digest('hex')
        const user = await User.create({ nome, senha: senhaHash, login })
        res.status(200).json({
            mensagem: 'usuario cadastrado', data: {
                id: user.id, nome: user.nome, login: user.login, ehAdmin: user.ehAdmin,
                ehPremium: user.ehPremium, moedas: user.moedas
            }
        })

    } catch (error) {
        if (error.name == 'SequelizeUniqueConstraintError') {
            return res.status(404).json({ mensagem: 'usuário já existe' })
        }
        res.status(500).json({ mensagem: error.message, error })
    }
})

router.get('/loja', rotaUsuarioLogado, async (req, res) => {
    let current_time
    if (db.getDialect() == 'sqlite') current_time = 'CURRENT_TIMESTAMP'
    else current_time = 'now()'
    try {
        const queryString = `
            select venda.idSkin idSkin, valor, imagemSkin, nomeSkin, tipoPeca from venda
            join season on season.id = venda.idSeason
            join skin on skin.id = venda.idSkin
            where now() BETWEEN inicioVigencia and fimVigencia
            and skin.id not in (select idSkin from compra where idUsuario = :id);
        `

        const [results] = await db.query(queryString, {
            replacements: {
                id: req.session.user.id
            }
        })
        console.log("Returned from DB: ", results)
        data = results.map(item => {
            return {
                idSkin: item.idSkin,
                skinName: item.nomeSkin,
                skinImg: item.imagemSkin,
                precoSkin: item.valor,
                onça: item.tipoPeca == 0
            }
        })
        res.status(200).json({ mensagem: 'OK', data })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: error.message, data: null })
    }


})

router.post('/comprarmoeda', rotaUsuarioLogado, async (req, res) => {
    const { quantidade } = req.body
    const tran = await User.sequelize.transaction()
    try {
        const user = await User.findByPk(req.session.user.id, {
            attributes: ['nome', 'id', 'login', 'ehPremium', 'ehAdmin', 'moedas'],

        })
        await user.increment('moedas', { by: quantidade }, { transaction: tran })
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

router.post('/comprarskin', rotaUsuarioLogado, async (req, res) => {
    const { idSkin } = req.body
    let result
    try {
        query = `
            select @moedas:= moedas from usuario where idUsuario = :id_usuario;

            select @valor:=valor from venda
            join season on season.id = venda.idSeason
            join skin on skin.id = venda.idSkin
            where now() between season.inicioVigencia and season.fimVigencia
            and prioridade = (
                select max(prioridade) from season where 
                now() between season.inicioVigencia and season.fimVigencia
            )
            and venda.idSkin = :id_skin
            limit 1 ;

            start transaction;
                insert into compra(idUsuario, idSkin)
                select :id_usuario, :id_skin where @moedas >= @valor
                and :id_skin not in (select idSkin from compra where  idUsuario = :id_usuario);
                
                update usuario set moedas = moedas - @valor
                where idUsuario = :id_usuario
                and @moedas >= @valor;
                select @moedas >= @valor and :id_skin in (select idSkin from compra where  idUsuario = :id_usuario),
                moedas from usuario where idUsuario = :id_usuario;
            commit;
        `
        result = await db.query(query, {
            replacements: { id_usuario: req.session.user.id, id_skin: idSkin },
            type: QueryTypes.SELECT,
        })
        // console.log(Object.values(result[5]))
        let resposta = {}
        Object.entries(result[5]['0']).forEach(item => {
            if (item[0] == 'moedas') resposta.moedas = item[1]
            else resposta.comprouSkin = item[1] == 1
        })
        if (resposta.comprouSkin) {
            res.json(resposta)
        } else {
            res.status(400).json({ mensagem: 'sem moedas suficientes' })
        }
    }
    catch (error) {
        console.error(error)
        res.status(500).json({ error })
    }
})
router.get('/logout', rotaUsuarioLogado, (req, res) => {
    req.session.destroy((error) => {
        if (!error) return res.end()
        res.status(404).json({ mensagem: error.message })
    })
})

router.get('/salasDisponiveis', async (req, res) => {
    res.json(getSalasDisponiveis())
})



router.get('*', (req, res) => res.status(404).end())
module.exports = router