/* eslint-disable linebreak-style */
/* eslint-disable import/no-extraneous-dependencies */
const crypto = require('crypto');
const { QueryTypes } = require('sequelize');
// const User = require('./models/User');
const db = require('./db');
/**
 * verifica se as informações de login estão corretas
*/
const verificaLogin = async (req, res) => {
  const { login, senha } = req.body;
  try {
    const senhaHash = await crypto.createHash('sha256').update(senha).digest('hex');

    const queryString = `
           select nomeExibicao nome, ehPremium, moedas, ehSuperUser, onca.imagemSkin skinOnca, usuario.idUsuario id,
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
        `;
    const user = await db.query(queryString, {
      replacements: [login, senhaHash],
      type: QueryTypes.SELECT,

    });
    // eslint-disable-next-line eqeqeq
    if (user.length != 0) {
      // eslint-disable-next-line prefer-destructuring
      const userSession = user[0];
      req.session.user = userSession;
      return res.status(200).json({ mensagem: 'usuário logado', data: user[0] });
    }
    return res.status(402).json({ mensagem: 'credenciais inválidas', data: null });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ mensagem: error.message, data: null });
  }
};
/**
 * retorna o status 401 se a requisição não enviar um cookie válido
*/
const rotaUsuarioLogado = (req, res, next) => {
  if (req.session && req.session.user) {
    return next();
  }
  return res.status(401).json({ mensagem: 'usuário não logado', data: null });
};

/**
 * rota acessivel apenas para usuario não logado
*/
const rotaUsuarioNaoLogado = (req, res, next) => {
  if (!req.session.user) {
    return next();
  }
  return res.status(400).json({ mensagem: 'acessivel apenas para usuario não logado', data: null });
};

/**
 * rota acessivel apenas para super usuario
 */
const rotaSuperUsuarioLogado = (req, res, next) => {
  if (req.session && req.session.user && req.session.user.ehSuperUser) {
    return next();
  }
  return res.status(402).json({ mensagem: 'superusuário não logado', data: null });
};

module.exports = {
  verificaLogin, rotaUsuarioLogado, rotaSuperUsuarioLogado, rotaUsuarioNaoLogado,
};
