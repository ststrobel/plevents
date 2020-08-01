const { Sequelize, DataTypes, Model } = require('sequelize');
const sequelize = new Sequelize('cvjm', 'cvjm', 'cvjm', {
  host: 'localhost',
  dialect: 'mysql',
  logging: false,
});

export class Log extends Model {}

Log.init(
  {
    // Model attributes are defined here
    user: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    message: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    sequelize, // pass the connection instance
    modelName: 'Log',
    freezeTableName: true,
  }
);
