import { ParticipantI } from '../../../common/participant';
import { Event } from './event';
const { Sequelize, DataTypes, Model } = require('sequelize');
const sequelize = new Sequelize('cvjm', 'cvjm', 'cvjm', {
  host: 'localhost',
  dialect: 'mysql',
  logging: false,
});

export class Participant extends Model implements ParticipantI {
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

Participant.event = Participant.belongsTo(Event);
