/* eslint-disable linebreak-style */
/* eslint-disable import/no-extraneous-dependencies */
const { Model, DataTypes } = require('sequelize');

class User extends Model {
  static init(connection) {
    super.init({
      id: {
        field: 'idUsuario',
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      nome: {
        field: 'nomeExibicao',
        type: DataTypes.STRING,
        allowNull: false,
      },
      login: {
        field: 'loginUsuario',
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
      },
      senha: {
        field: 'senhaUsuario',
        allowNull: false,
        type: DataTypes.STRING,
      },
      ehPremium: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      ehAdmin: {
        field: 'ehSuperUser',
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      moedas: {
        allowNull: false,
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
    }, {
      sequelize: connection,
      tableName: 'usuario',
      timestamps: false,
    });
  }
}

module.exports = User;
