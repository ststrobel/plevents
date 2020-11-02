import { User } from '../models/user';
import { Log } from '../models/log';
import { Tenant } from '../models/tenant';
import { getConnection } from 'typeorm';
import { TenantRelation } from '../models/tenant-relation';
import { map } from 'lodash';
import { Verification, VerificationType } from '../models/verification';
import { EmailService, EMAIL_TEMPLATES } from './email-service';
import { ROUTES } from '../../../common/frontend.routes';
import { EventRelation } from '../models/event-relation';

export class UserService {
  public static async createUserProfile(
    email: string,
    name: string,
    password: string
  ): Promise<User> {
    try {
      // check first if user already exists
      const existingUser = await User.findOne({ email });
      if (!existingUser) {
        const newUser = new User();
        newUser.email = email;
        newUser.name = name;
        newUser.password = password;
        await newUser.save();
        // after the user is created, generate a verification code and send an email
        const verification = new Verification();
        verification.userId = newUser.id;
        verification.type = VerificationType.REGISTRATION;
        await verification.save();
        // now send out an email to make the user confirm his profile
        const confirmationlink = `${process.env.DOMAIN}/${ROUTES.REGISTER_USER_FINISH}?code=${verification.code}`;
        EmailService.get().send(EMAIL_TEMPLATES.REGISTER, newUser.email, {
          name: newUser.name,
          confirmationlink,
        });
        return newUser;
      }
      return null;
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
        .andWhere(`user.active = 1`)
        .getOne();
      if (existingUser) {
        // check if user is active or not
        const authResult = await existingUser.validPassword(password);
        if (authResult) {
          return true;
        } else {
          Log.write(null, existingUser.id, 'Fehlgeschlagener Login-Versuch');
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
  public static username(request: any): string {
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
   * extract the user object based on the basic auth header or null if not found / an error happens
   * @param request
   */
  public static async currentUser(request: any): Promise<User> {
    try {
      return User.findOneOrFail({ where: { email: this.username(request) } });
    } catch (e) {
      console.error(
        `Could not extract user based on username ${this.username(request)}`,
        e
      );
      return null;
    }
  }

  /**
   * get all tenants of the currently logged-in user that he is an active admin for
   * @param request
   */
  public static async tenantsOfRequestUser(request: any): Promise<Tenant[]> {
    try {
      // first get the current user, to then search for the corresponding tenant
      const user = await User.findOneOrFail({
        email: UserService.username(request),
      });
      const tenantRelations = await TenantRelation.find({
        where: { userId: user.id, active: true },
        relations: ['tenant'],
      });
      return map(tenantRelations, 'tenant');
    } catch (e) {
      throw e;
    }
  }

  public static async allowOnEvent(
    userId: string,
    eventId: string
  ): Promise<EventRelation> {
    // first, check that there is no relation yet. if so, just ignore it.
    const existingRelation = await EventRelation.findOne({
      where: { userId, eventId },
    });
    if (existingRelation) {
      return existingRelation;
    }
    const newRelation = new EventRelation();
    newRelation.userId = userId;
    newRelation.eventId = eventId;
    await newRelation.save();
    return newRelation;
  }

  public static async denyOnEvent(
    userId: string,
    eventId: string
  ): Promise<void> {
    EventRelation.delete({ userId, eventId });
  }

  public static async allowOnEventSeries(
    userId: string,
    eventSeriesId: string
  ): Promise<EventRelation> {
    // first, check that there is no relation yet. if so, just ignore it.
    const existingRelation = await EventRelation.findOne({
      where: { userId, eventSeriesId },
    });
    if (existingRelation) {
      return existingRelation;
    }
    const newRelation = new EventRelation();
    newRelation.userId = userId;
    newRelation.eventSeriesId = eventSeriesId;
    await newRelation.save();
    return newRelation;
  }

  public static async denyOnEventSeries(
    userId: string,
    eventSeriesId: string
  ): Promise<void> {
    EventRelation.delete({ userId, eventSeriesId });
  }

  public static async loadEventsWithAccessTo(
    email: string
  ): Promise<EventRelation[]> {
    const user = await User.findOneOrFail({ where: { email } });
    return await EventRelation.find({ userId: user.id });
  }
}
