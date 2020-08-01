import { User } from '../models/user';
import { Log } from '../models/log';

export class UserService {
  public static async createUser(username: string, password: string) {
    try {
      // check first if user already exists
      const existingUser = await User.findByPk(username);
      if (existingUser) {
        existingUser.password = password;
        existingUser.save();
        console.log('user ' + existingUser.username + ' updated');
      } else {
        const newUser = User.build({ username: username, password: password });
        newUser.save();
        console.log('user ' + existingUser.username + ' created');
      }
    } catch (e) {
      throw e;
    }
  }

  public static async checkCredentials(username: string, password: string): Promise<boolean> {
    try {
      // check first if user already exists
      const existingUser = await User.findByPk(username);
      if (existingUser) {
        const authResult = await existingUser.validPassword(password);
        if (!authResult) {
          const logMessage = `Fehlgeschlagener Login-Versuch`;
          Log.build({ user: username, message: logMessage }).save();
        }
        return authResult;
      }
      return false;
    } catch (e) {
      console.log(e);
      return false;
    }
  }

  public static currentUser(request: any): string {
    try {
      const authHeader = request.get('Authorization');
      const base64Credentials = authHeader.split(' ')[1];
      const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
      return credentials.split(':')[0];
    } catch (e) {
      return 'anonymous';
    }
  }
}
