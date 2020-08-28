import { User } from '../models/user';
import { Log } from '../models/log';
import { Tenant } from '../models/tenant';
import { getConnection } from 'typeorm';

export class UserService {
  public static async createUser(
    tenantId: string,
    email: string,
    name: string,
    password: string
  ): Promise<User> {
    try {
      // check first if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        existingUser.password = password;
        return existingUser.save();
      } else {
        const newUser = new User();
        newUser.email = email;
        newUser.name = name;
        newUser.password = password;
        newUser.tenant = (await Tenant.findOneOrFail(tenantId)) as Tenant;
        return newUser.save();
      }
    } catch (e) {
      throw e;
    }
  }

  public static async checkCredentials(
    email: string,
    password: string
  ): Promise<boolean> {
    try {
      // check first if user already exists
      const existingUser = await getConnection()
        .createQueryBuilder()
        .select('user')
        .addSelect('user.password')
        .from(User, 'user')
        .where(`user.email = "${email}"`)
        .leftJoinAndSelect('user.tenant', 'tenant')
        .getOne();
      if (existingUser) {
        // check if user is active or not
        if (existingUser.active) {
          const authResult = await existingUser.validPassword(password);
          if (authResult) {
            return true;
          } else {
            Log.write(
              existingUser.tenant.id,
              existingUser.id,
              'Fehlgeschlagener Login-Versuch'
            );
            return false;
          }
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
      const credentials = Buffer.from(base64Credentials, 'base64').toString(
        'ascii'
      );
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
      const user = await User.findOne({
        email: UserService.currentUser(request),
      });
      return user.tenant;
    } catch (e) {
      throw e;
    }
  }
}
