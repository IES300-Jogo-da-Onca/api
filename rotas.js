const express = require('express')
const crypto = require('crypto')
const { verificaLogin, rotaUsuarioLogado, rotaUsuarioNaoLogado, rotaSuperUsuarioLogado } = require('./auth.js')
const router = express.Router()
const User = require('./models/User')
const db = require('./db')
const { QueryTypes } = require('sequelize')
const { getSalasDisponiveis } = require('./utils.js')
const { receiveMessageOnPort } = require('worker_threads')

router.get('/', (req, res) => {
    res.status(200).json({
        teste: "testando 123"
    })
})

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
        select venda.idSkin idSkin, valor, imagemSkin, nomeSkin, tipoPeca, idSeason from venda
        join season on season.id = venda.idSeason
        join skin on skin.id = venda.idSkin
        where now() BETWEEN inicioVigencia and fimVigencia
        and skin.id not in (select idSkin from compra where idUsuario = 2)
        and valor = (select min(valor) from venda 
          join season on season.id = venda.idSeason
          join skin on skin.id = venda.idSkin
          where now() BETWEEN inicioVigencia and fimVigencia
        );
`

        const [results] = await db.query(queryString, {
            replacements: {
                id: req.session.user.id
            }
        })
        // console.log("Returned from DB: ", results)
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
            and venda.idSkin = :id_skin
            order by valor asc limit 1 ;

            start transaction;
                insert into compra(idUsuario, idSkin)
                select :id_usuario, :id_skin where @moedas >= @valor
                and :id_skin not in (select idSkin from compra where  idUsuario = :id_usuario);

                select @comprouSkin:= row_count() = 1;

                update usuario set moedas = moedas - @valor
                where idUsuario = :id_usuario
                and @moedas >= @valor;

                select @comprouSkin,
                moedas from usuario where idUsuario = :id_usuario;
            commit;
        `
        result = await db.query(query, {
            replacements: { id_usuario: req.session.user.id, id_skin: idSkin },
            type: QueryTypes.SELECT,
        })
        let resposta = {}
        Object.entries(result[6]['0']).forEach(item => {
            if (item[0] == 'moedas') resposta.moedas = item[1]
            else resposta.comprouSkin = item[1] == 1
        })
        if (resposta.comprouSkin) {
            res.json(resposta)
        } else {
            console.log(result)
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

router.get('/salasDisponiveis', rotaUsuarioLogado, (req, res) => {
    res.json(getSalasDisponiveis())
})

router.get('/skins', rotaUsuarioLogado, async (req, res) => {
    const query = `
        select s.id, s.nomeSkin, s.imagemSkin,
        tipoPeca ehCachorro,
        case when u.idSkinOncaEquipada = c.idSkin or u.idSkinCachorroEquipada = c.idSkin then 1
        else 0 end equipada
        from skin s join compra c on c.idSkin = s.id
        join usuario u on u.idUsuario = :id_usuario
        where c.idUsuario = :id_usuario
   `
    try {
        result = await db.query(query, {
            replacements: { id_usuario: req.session.user.id, },
            type: QueryTypes.SELECT,
        })
        res.json(result)

    } catch (error) {
        res.status(500).json({ error })
    }
})

router.post('/equiparSkin', rotaUsuarioLogado, async (req, res) => {
    const { idSkin, ehCachorro } = req.body
    const coluna = ehCachorro ? 'idSkinCachorroEquipada' : 'idSkinOncaEquipada'
    const query = `
        update usuario set ${coluna} = :idSkin
        where idUsuario = :id_usuario;

        select nomeExibicao nome, ehPremium, ehSuperUser, moedas, onca.imagemSkin skinOnca, usuario.idUsuario id,
        cachorro.imagemSkin skinCachorro
        from usuario left join skin onca on onca.id = usuario.idSkinOncaEquipada
        left join skin cachorro on cachorro.id = usuario.idSkinCachorroEquipada
        where idUsuario = :id_usuario;
    `
    try {
        result = await db.query(query, {
            replacements: { id_usuario: req.session.user.id, idSkin },
            type: QueryTypes.SELECT,
        })
        userData = result[1]['0']
        res.json(userData)

    } catch (error) {
        console.error(error)
        res.status(500).json({ error })
    }

})

router.post('/alterarDados', async (req, res) => {
    let alterou = false
    const { nome, senha, novaSenha } = req.body
    try {
        const user = await User.findByPk(req.session.user.id)
        if (nome && user.nome !== nome) {
            user.nome = nome
            alterou = true
            req.session.user.nome = nome
        }
        if (senha && novaSenha) {
            const senhaHash = await crypto.createHash('sha256').update(senha).digest('hex')
            if (user.senha === senhaHash) {
                user.senha = await crypto.createHash('sha256').update(novaSenha).digest('hex')
                alterou = true
            }
            else {
                return res.status(401).json({ mensagem: 'senha inválida' })
            }
        }
        if (alterou) {
            await user.save()
            return res.json({ mensagem: 'Dados alterados com sucesso', data: { nome } })
        }
        return res.json({ mensagem: "Sem alterações", data: {} })
    }
    catch (e) {
        console.error(e)
        res.status(500).json({ e })
    }
})

router.get('/autoIncrementSkin', rotaSuperUsuarioLogado, async (req, res) => {
    const query = `
        SELECT auto_increment 
        FROM information_schema.TABLES 
        WHERE TABLE_SCHEMA = 'testedb' AND TABLE_NAME = 'skin'
   `
    try {
        result = await db.query(query, {
            type: QueryTypes.SELECT,
        })
        res.json(result)

    } catch (error) {
        res.status(500).json({ error })
    }
})

router.get('/autoIncrementTabuleiro', rotaSuperUsuarioLogado, async (req, res) => {
    const query = `
        SELECT auto_increment 
        FROM information_schema.TABLES 
        WHERE TABLE_SCHEMA = 'testedb' AND TABLE_NAME = 'tabuleiro'
   `
    try {
        result = await db.query(query, {
            type: QueryTypes.SELECT,
        })
        res.json(result)

    } catch (error) {
        res.status(500).json({ error })
    }
})

router.get('/autoIncrementSeason', rotaSuperUsuarioLogado, async (req, res) => {
    const query = `
        SELECT auto_increment 
        FROM information_schema.TABLES 
        WHERE TABLE_SCHEMA = 'testedb' AND TABLE_NAME = 'season'
   `
    try {
        result = await db.query(query, {
            type: QueryTypes.SELECT,
        })
        res.json(result)

    } catch (error) {
        res.status(500).json({ error })
    }
})

router.get('/autoIncrementVenda', rotaSuperUsuarioLogado, async (req, res) => {
    const query = `
        SELECT auto_increment 
        FROM information_schema.TABLES 
        WHERE TABLE_SCHEMA = 'testedb' AND TABLE_NAME = 'venda'
   `
    try {
        result = await db.query(query, {
            type: QueryTypes.SELECT,
        })
        res.json(result)

    } catch (error) {
        res.status(500).json({ error })
    }
})

router.get('/consultarSkins', rotaSuperUsuarioLogado, async (req,res) => {
    const query = `
        SELECT * 
        FROM skin
   `
    try {
        result = await db.query(query, {
            type: QueryTypes.SELECT,
        })
        res.json(result)

    } catch (error) {
        res.status(500).json({ error })
    }
})

router.get('/consultarTabuleiros', rotaSuperUsuarioLogado, async (req,res) => {
    const query = `
        SELECT * 
        FROM tabuleiro
   `
    try {
        result = await db.query(query, {
            type: QueryTypes.SELECT,
        })
        res.json(result)

    } catch (error) {
        res.status(500).json({ error })
    }
})

router.get('/consultarSeasons', rotaSuperUsuarioLogado, async (req,res) => {
    const query = `
        SELECT * 
        FROM season
   `
    try {
        result = await db.query(query, {
            type: QueryTypes.SELECT,
        })
        res.json(result)

    } catch (error) {
        res.status(500).json({ error })
    }
})

router.get('/consultarVendas', rotaSuperUsuarioLogado, async (req,res) => {
    const query = `
        SELECT * 
        FROM venda
   `
    try {
        result = await db.query(query, {
            type: QueryTypes.SELECT,
        })
        res.json(result)

    } catch (error) {
        res.status(500).json({ error })
    }
})

router.post('/alterarSkin', rotaSuperUsuarioLogado, async(req,res) => {
    const { id,nome,imagem,tipoPeca,corTematica } = req.body

    const query = `
        update skin SET 
        nomeSkin = :nomeSkin, imagemSkin = :imagemSkin, 
        tipoPeca = :tipoPeca, corTematica = :corTematica
        where id = :id
    `

    try {
        result = await db.query(query, {
            replacements: { nomeSkin: nome, imagemSkin: imagem, tipoPeca: tipoPeca, corTematica: corTematica, id: id },
            type: QueryTypes.UPDATE,
        })
        res.json(result)

    } catch (error) {
        console.log(error)
        res.status(500).json({ error })
    }
})

router.post('/alterarTabuleiro', rotaSuperUsuarioLogado, async(req,res) => {
    const { id,nome,imagem,corTematica } = req.body

    const query = `
        update tabuleiro SET 
        nomeTabuleiro = :nomeTabuleiro, imagemTabuleiro = :imagemTabuleiro, 
        corTematica = :corTematica
        where id = :id
    `

    try {
        result = await db.query(query, {
            replacements: { nomeTabuleiro: nome, imagemTabuleiro: imagem, corTematica: corTematica, id: id },
            type: QueryTypes.UPDATE,
        })
        res.json(result)

    } catch (error) {
        console.log(error)
        res.status(500).json({ error })
    }
})

router.post('/alterarSeason', rotaSuperUsuarioLogado, async(req,res) => {
    const { id,nome,inicioVigencia,fimVigencia,idTabuleiro,prioridade } = req.body

    const query = `
        update season SET 
        nomeSeason = :nome, inicioVigencia = :inicioVigencia,
        fimVigencia = :fimVigencia, idTabuleiro = :idTabuleiro,
        prioridade = :prioridade
        where id = :id
    `

    try {
        result = await db.query(query, {
            replacements: { nome: nome, inicioVigencia: inicioVigencia, fimVigencia: fimVigencia,
                 idTabuleiro: idTabuleiro, prioridade: prioridade, id: id },
            type: QueryTypes.UPDATE,
        })
        res.json(result)

    } catch (error) {
        console.log(error)
        res.status(500).json({ error })
    }
})

router.post('/alterarVenda', rotaSuperUsuarioLogado, async(req,res) => {
    const { id,valor,idSeason,idSkin } = req.body
    if(!parseInt(valor) || valor < 1){
        return res.status(500).json({mensagem: "valor inválido"})
    }
    const query = `
        update venda SET 
        valor = :valor, idSeason = :idSeason, idSkin = :idSkin
        where id = :id
    `

    try {
        result = await db.query(query, {
            replacements: { valor: valor, idSeason: idSeason, idSkin: idSkin, id: id },
            type: QueryTypes.UPDATE,
        })
        res.json(result)

    } catch (error) {
        console.log(error)
        res.status(500).json({ error })
    }
})

router.post('/consultarSkin', rotaSuperUsuarioLogado, async (req,res) => {
    const { id } = req.body
    const query = `
        SELECT * 
        FROM skin
        where id = :id
   `
    try {
        result = await db.query(query, {
            replacements : {id: id},
            type: QueryTypes.SELECT,
        })
        res.json(result)

    } catch (error) {
        res.status(500).json({ error })
    }
})

router.post('/consultarTabuleiro', rotaSuperUsuarioLogado, async (req,res) => {
    const { id } = req.body
    const query = `
        SELECT * 
        FROM tabuleiro
        where id = :id
   `
    try {
        result = await db.query(query, {
            replacements : {id: id},
            type: QueryTypes.SELECT,
        })
        res.json(result)

    } catch (error) {
        res.status(500).json({ error })
    }
})

router.post('/consultarSeason', rotaSuperUsuarioLogado, async (req,res) => {
    const { id } = req.body
    const query = `
        SELECT * 
        FROM season
        where id = :id
   `
    try {
        result = await db.query(query, {
            replacements : {id: id},
            type: QueryTypes.SELECT,
        })
        res.json(result)

    } catch (error) {
        res.status(500).json({ error })
    }
})

router.post('/consultarVenda', rotaSuperUsuarioLogado, async (req,res) => {
    const { id } = req.body
    const query = `
        SELECT * 
        FROM venda
        where id = :id
   `
    try {
        result = await db.query(query, {
            replacements : {id: id},
            type: QueryTypes.SELECT,
        })
        res.json(result)

    } catch (error) {
        res.status(500).json({ error })
    }
})

router.post('/inserirSkin', rotaSuperUsuarioLogado, async(req,res) => {
    const { nome,imagem,tipoPeca,corTematica } = req.body

    const query = `
        insert into skin (nomeSkin,imagemSkin,tipoPeca,corTematica)
        values(:nomeSkin,:imagemSkin,:tipoPeca,:corTematica) 
    `

    try {
        result = await db.query(query, {
            replacements: { nomeSkin: nome, imagemSkin: imagem, tipoPeca: tipoPeca, corTematica: corTematica },
            type: QueryTypes.INSERT,
        })
        res.json(result)

    } catch (error) {
        console.log(error)
        res.status(500).json({ error })
    }
})

router.post('/inserirTabuleiro', rotaSuperUsuarioLogado, async(req,res) => {
    const { nome,imagem,corTematica } = req.body

    const query = `
        insert into tabuleiro (nomeTabuleiro,imagemTabuleiro,corTematica)
        values(:nomeTabuleiro,:imagemTabuleiro,:corTematica) 
    `

    try {
        result = await db.query(query, {
            replacements: { nomeTabuleiro: nome, imagemTabuleiro: imagem, corTematica: corTematica },
            type: QueryTypes.INSERT,
        })
        res.json(result)

    } catch (error) {
        console.log(error)
        res.status(500).json({ error })
    }
})

router.post('/inserirSeason', rotaSuperUsuarioLogado, async(req,res) => {
    const { nome,inicioVigencia,fimVigencia,idTabuleiro,prioridade } = req.body

    const query = `
        insert into season (nomeSeason,inicioVigencia,fimVigencia,idTabuleiro,prioridade)
        values(:nome,:inicioVigencia,:fimVigencia,:idTabuleiro,:prioridade) 
    `

    try {
        result = await db.query(query, {
            replacements: { nome: nome, inicioVigencia: inicioVigencia, fimVigencia: fimVigencia,
                idTabuleiro: idTabuleiro, prioridade: prioridade },
            type: QueryTypes.INSERT,
        })
        res.json(result)

    } catch (error) {
        console.log(error)
        res.status(500).json({ error })
    }
})

router.post('/inserirVenda', rotaSuperUsuarioLogado, async(req,res) => {
    const { valor,idSeason,idSkin } = req.body
    if(!parseInt(valor) || valor < 1){
        return res.status(500).json({mensagem: "valor inválido"})
    }
    const query = `
        insert into venda (valor,idSeason,idSkin)
        values(:valor,:idSeason,:idSkin) 
    `

    try {
        result = await db.query(query, {
            replacements: { valor: valor, idSeason: idSeason, idSkin: idSkin },
            type: QueryTypes.INSERT,
        })
        res.json(result)

    } catch (error) {
        console.log(error)
        res.status(500).json({ error })
    }
})

router.post('/removerSkin', rotaSuperUsuarioLogado, async(req,res) => {
    const { id } = req.body

    const query = `
        delete from skin
        where id = :id
    `

    try {
        result = await db.query(query, {
            replacements: { id: id },
            type: QueryTypes.DELETE,
        })
        res.json(result)

    } catch (error) {
        console.log(error)
        res.status(500).json({ error })
    }
})

router.post('/removerTabuleiro', rotaSuperUsuarioLogado, async(req,res) => {
    const { id } = req.body

    const query = `
        delete from tabuleiro
        where id = :id
    `

    try {
        result = await db.query(query, {
            replacements: { id: id },
            type: QueryTypes.DELETE,
        })
        res.json(result)

    } catch (error) {
        console.log(error)
        res.status(500).json({ error })
    }
})

router.post('/removerSeason', rotaSuperUsuarioLogado, async(req,res) => {
    const { id } = req.body

    const query = `
        delete from season
        where id = :id
    `

    try {
        result = await db.query(query, {
            replacements: { id: id },
            type: QueryTypes.DELETE,
        })
        res.json(result)

    } catch (error) {
        console.log(error)
        res.status(500).json({ error })
    }
})

router.post('/removerVenda', rotaSuperUsuarioLogado, async(req,res) => {
    const { id } = req.body

    const query = `
        delete from venda
        where id = :id
    `

    try {
        result = await db.query(query, {
            replacements: { id: id },
            type: QueryTypes.DELETE,
        })
        res.json(result)

    } catch (error) {
        console.log(error)
        res.status(500).json({ error })
    }
})

router.post('/isRemovivelSkin', rotaSuperUsuarioLogado, async (req,res) => {
    const { id } = req.body

    const query = `
        SELECT * 
        FROM venda
        where idSkin = :id
   `

    try {
        result = await db.query(query, {
            replacements : {id: id},
            type: QueryTypes.SELECT,
        })

        res.json(result[0]==undefined)

    } catch (error) {
        res.status(500).json({ error })
    }
})

router.post('/isRemovivelTabuleiro', rotaSuperUsuarioLogado, async (req,res) => {
    const { id } = req.body

    const query = `
        SELECT * 
        FROM season
        where idTabuleiro = :id
   `

    try {
        result = await db.query(query, {
            replacements : {id: id},
            type: QueryTypes.SELECT,
        })
        
        res.json(result[0]==undefined)

    } catch (error) {
        res.status(500).json({ error })
    }
})

router.post('/isRemovivelSeason', rotaSuperUsuarioLogado, async (req,res) => {
    const { id } = req.body

    const query = `
        SELECT * 
        FROM venda
        where idSeason = :id
   `

    try {
        result = await db.query(query, {
            replacements : {id: id},
            type: QueryTypes.SELECT,
        })
        
        res.json(result[0]==undefined)

    } catch (error) {
        res.status(500).json({ error })
    }
})

router.post('/isPeriodoDisponivelSeason', rotaSuperUsuarioLogado, async (req,res) => {
    const { id,inicio,fim,prioridade } = req.body

    const query = `
        select * from season 
        where (:inicioVigencia between inicioVigencia and fimVigencia or :fimVigencia between inicioVigencia and fimVigencia) 
        and prioridade >= :prioridade and id != :id
   `

    try {
        result = await db.query(query, {
            replacements : {inicioVigencia: inicio, fimVigencia: fim, prioridade: prioridade, id: id},
            type: QueryTypes.SELECT,
        })
        console.log(result)
        res.json(result[0]==undefined)

    } catch (error) {
        res.status(500).json({ error })
    }
})

router.get('*', (req, res) => res.status(404).end())
module.exports = router