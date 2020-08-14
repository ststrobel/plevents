import { EventI } from '../../../common/event';
import { Participant } from './participant';
const { Sequelize, DataTypes, Model } = require('sequelize');
const dotenv = require('dotenv');
dotenv.config();
const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USERNAME, process.env.DB_PASSWORD, {
  host: process.env.DB_HOST,
  dialect: process.env.DB_TYPE,
  logging: false,
});

export class Event extends Model implements EventI {
  name: string;
  date: Date;
  maxSeats: number;
  takenSeats: number;
  disabled: boolean;
  targetClass: string;
  tenantId: number;
}

Event.init(
  {
    // Model attributes are defined here
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    maxSeats: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    targetClass: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    disabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    sequelize, // pass the connection instance
    modelName: 'Event',
    freezeTableName: true,
  }
);

Event.hasMany(Participant, {
  constraints: true,
  onDelete: 'cascade',
  foreignKey: 'EventId',
});
