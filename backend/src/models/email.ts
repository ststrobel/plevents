import { EmailI } from '../../../common/email';
const { Sequelize, DataTypes, Model } = require('sequelize');
const sequelize = new Sequelize('cvjm', 'cvjm', 'cvjm', {
  host: 'localhost',
  dialect: 'mysql',
  logging: false,
});

export class Email extends Model implements EmailI {
  public address!: string;
}

Email.init(
  {
    // Model attributes are defined here
    address: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        len: {
          args: [0, 100],
        },
      },
    },
  },
  {
    sequelize, // pass the connection instance
    modelName: 'Email',
    freezeTableName: true,
  }
);
