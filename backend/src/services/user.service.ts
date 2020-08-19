import { User } from '../models/user';
import { Log } from '../models/log';

export class UserService {
  public static async createUser(username: string, password: string) {
    try {
      // check first if user already exists
      const existingUser = await User.findOne({username});
      if (existingUser) {
        existingUser.password = password;
        existingUser.save();
      } else {
        const newUser = new User();
        newUser.username = username;
        newUser.password = password;
        newUser.save();
      }
    } catch (e) {
      throw e;
    }
  }

  public static async checkCredentials(username: string, password: string): Promise<boolean> {
    try {
      // check first if user already exists
      const existingUser = await User.findOne({username});
      if (existingUser) {
        const authResult = existingUser.validPassword(password);
        if (!authResult) {
          Log.write(existingUser.id, 'Fehlgeschlagener Login-Versuch');
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
