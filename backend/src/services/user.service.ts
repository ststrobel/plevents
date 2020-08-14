import { User } from '../models/user';
import { Log } from '../models/log';
import { Tenant } from '../models/tenant';

export class UserService {
  public static async createUser(tenantId: number, email: string, name: string, password: string) {
    try {
      // check first if user already exists
      const existingUser = (await User.findByPk(email)) as User;
      if (existingUser) {
        existingUser.password = password;
        existingUser.save();
        console.log('user ' + existingUser.email + ' updated');
      } else {
        const newUser = User.build({ tenantId, email, name, password });
        await newUser.save();
        console.log('user ' + email + ' created');
      }
    } catch (e) {
      throw e;
    }
  }

  public static async checkCredentials(email: string, password: string): Promise<boolean> {
    try {
      // check first if user already exists
      const existingUser = (await User.findOne({ where: { email } })) as User;
      if (existingUser) {
        // check if user is active or not
        if (existingUser.active) {
          const authResult = await existingUser.validPassword(password);
          if (!authResult) {
            const logMessage = `Fehlgeschlagener Login-Versuch`;
            Log.log(existingUser.tenantId, email, logMessage);
          }
          return authResult;
        } else {
          return false;
        }
      }
      return false;
    } catch (e) {
      console.log(e);
      return false;
    }
  }

  /**
   * extract the email from the basic auth header
   * @param request
   */
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

  /**
   * get the tenant context of the currently logged-in user
   * @param request
   */
  public static async currentTenant(request: any): Promise<Tenant> {
    try {
      // first get the current user, to then search for the corresponding tenant
      const user = (await User.findOne({ where: { email: UserService.currentUser(request) } })) as User;
      return Tenant.findOne({
        where: {
          id: user.tenantId,
        },
      }) as Promise<Tenant>;
    } catch (e) {
      throw e;
    }
  }
}
