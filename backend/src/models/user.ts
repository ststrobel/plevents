import { UserI } from '../../../common/user';
const { Sequelize, DataTypes, Model } = require('sequelize');
const dotenv = require('dotenv');
dotenv.config();
const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USERNAME, process.env.DB_PASSWORD, {
  host: process.env.DB_HOST,
  dialect: process.env.DB_TYPE,
  logging: false,
});
const bcrypt = require('bcrypt');

export class User extends Model implements UserI {
  public id: number;
  public tenantId: number;
  public email: string;
  public name: string;
  public password: string;
  public active: boolean;
}

User.init(
  {
    // Model attributes are defined here
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      primaryKey: false,
    },
    name: {
      type: DataTypes.STRING,
      unique: false,
    },
    active: {
      type: DataTypes.BOOLEAN,
      default: false,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    sequelize, // pass the connection instance
    modelName: 'User',
    freezeTableName: true,
  }
);

User.prototype.validPassword = function (password: string): boolean {
  return bcrypt.compare(password, this.password);
};

User.prototype.toJSON = function () {
  var values = Object.assign({}, this.get());
  delete values.password;
  return values;
};

function encryptUserPW(user: User) {
  return bcrypt
    .hash(user.password, 10)
    .then((hash: any) => {
      user.password = hash;
    })
    .catch((error: any) => {
      throw new Error(error);
    });
}
User.beforeCreate(encryptUserPW);
User.beforeUpdate(encryptUserPW);
