import { EventI } from '../../../common/event';
const { Sequelize, DataTypes, Model } = require('sequelize');
const sequelize = new Sequelize('cvjm', 'cvjm', 'cvjm', {
  host: 'localhost',
  dialect: 'mysql',
  logging: false,
});

export class Event extends Model implements EventI {
  name: string;
  date: Date;
  maxSeats: number;
  takenSeats: number;
  disabled: boolean;
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
