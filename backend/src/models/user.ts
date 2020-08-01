import { UserI } from '../../../common/user';
const { Sequelize, DataTypes, Model } = require('sequelize');
const sequelize = new Sequelize('cvjm', 'cvjm', 'cvjm', {
  host: 'localhost',
  dialect: 'mysql',
  logging: false,
});
const bcrypt = require('bcrypt');

export class User extends Model implements UserI {
  public username: string;
  public password: string;
}

User.init(
  {
    // Model attributes are defined here
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      primaryKey: true,
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
