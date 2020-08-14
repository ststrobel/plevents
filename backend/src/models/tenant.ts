import { TenantI } from '../../../common/tenant';
import { User } from './user';
import { Event } from './event';
const { Sequelize, DataTypes, Model } = require('sequelize');
const dotenv = require('dotenv');
dotenv.config();
const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USERNAME, process.env.DB_PASSWORD, {
  host: process.env.DB_HOST,
  dialect: process.env.DB_TYPE,
  logging: false,
});

export class Tenant extends Model implements TenantI {
  id?: number;
  name: string;
  logo: string;
  path: string;
}

Tenant.init(
  {
    // Model attributes are defined here
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: false,
      validate: {
        len: {
          args: [0, 100],
        },
      },
    },
    logo: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: false,
    },
    path: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        len: {
          args: [0, 50],
        },
      },
    },
  },
  {
    sequelize, // pass the connection instance
    modelName: 'Tenant',
    freezeTableName: true,
  }
);

Tenant.hasMany(User, {
  constraints: true,
  onDelete: 'cascade',
  foreignKey: 'tenantId',
});

Tenant.hasMany(Event, {
  constraints: true,
  onDelete: 'cascade',
  foreignKey: 'tenantId',
});
