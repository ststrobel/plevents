import { Email } from './models/email';
import { User } from './models/user';
import { Event } from './models/event';
import { Participant } from './models/participant';
import { Log } from './models/log';
const { Sequelize } = require('sequelize');

export class DBConnection {
  private static conn = null;

  public static getConnection() {
    if (DBConnection.conn === null) {
      DBConnection.conn = new Sequelize(process.env.DB_NAME, process.env.DB_USERNAME, process.env.DB_PASSWORD, {
        host: process.env.DB_HOST,
        dialect: process.env.DB_TYPE,
        logging: false,
      });
    }
    return DBConnection.conn;
  }

  public static async init() {
    try {
      const connection = DBConnection.getConnection();
      await connection.authenticate();
      console.log('\x1b[32mDB Connection has been established successfully.\x1b[0m');
      await User.sync({ alter: true });
      await Email.sync({ alter: false });
      await Event.sync({ alter: true });
      await Participant.sync({ alter: true });
      await Log.sync({ alter: true });
      console.log('\x1b[32mTables set up successfully.\x1b[0m');
    } catch (error) {
      console.error('\x1b[31mUnable to connect to the database\x1b[0m', error);
    }
  }
}
