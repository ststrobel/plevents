import { Tenant } from './tenant';
import { isNumber } from 'lodash';

const { Sequelize, DataTypes, Model } = require('sequelize');
const dotenv = require('dotenv');
dotenv.config();
const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USERNAME, process.env.DB_PASSWORD, {
  host: process.env.DB_HOST,
  dialect: process.env.DB_TYPE,
  logging: false,
});

export class Log extends Model {
  static log(tenant: number | Tenant | Promise<Tenant>, user: string, message: string): void {
    if (isNumber(tenant)) {
      Log.build({ tenant, user, message }).save();
    } else if (tenant instanceof Tenant) {
      Log.build({ tenant: tenant.id, user, message }).save();
    } else {
      (tenant as Promise<Tenant>).then((tenant: Tenant) => {
        Log.build({ tenant: tenant.id, user, message }).save();
      });
    }
  }
}

Log.init(
  {
    // Model attributes are defined here
    tenant: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
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
