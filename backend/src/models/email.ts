import { EmailI } from '../../../common/email';
const { Sequelize, DataTypes, Model } = require('sequelize');
const dotenv = require('dotenv');
dotenv.config();
const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USERNAME, process.env.DB_PASSWORD, {
  host: process.env.DB_HOST,
  dialect: process.env.DB_TYPE,
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
