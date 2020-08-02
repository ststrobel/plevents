import { ParticipantI } from '../../../common/participant';
import { Event } from './event';
const { Sequelize, DataTypes, Model } = require('sequelize');
const dotenv = require('dotenv');
dotenv.config();
const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USERNAME, process.env.DB_PASSWORD, {
  host: process.env.DB_HOST,
  dialect: process.env.DB_TYPE,
  logging: false,
});

export class Participant extends Model implements ParticipantI {
  email: string;
  phone: string;
  name: string;
  street: string;
  zip: string;
  city: string;
  EventId: number;
}

Participant.init(
  {
    // Model attributes are defined here
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    street: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    zip: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    city: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    sequelize, // pass the connection instance
    modelName: 'Participant',
    freezeTableName: true,
  }
);
/*
Participant.event = Participant.belongsTo(Event, {
  constraints: true,
  onDelete: 'CASCADE',
});*/
