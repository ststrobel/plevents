import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  BaseEntity,
  OneToMany,
  ManyToOne,
} from 'typeorm';
import { User } from './user';
import { Tenant } from './tenant';

@Entity()
export class Log extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  tenantId: string;

  @Column()
  userId: string;

  @Column()
  message: string;

  static async write(
    tenant: string | Promise<Tenant>,
    user: string,
    message: string
  ) {
    const log = new Log();
    log.message = message;
    await Log.resolveUser(user).then(userId => {
      log.userId = userId;
      if (typeof tenant === 'string') {
        log.tenantId = tenant;
        log.save();
      } else {
        tenant.then(tenant => {
          log.tenantId = tenant.id;
          log.save();
        });
      }
    });
  }

  /**
   * based on an ID or email address, resolve the ID of the user
   * @param user
   */
  private static async resolveUser(user: string): Promise<string> {
    if (user.indexOf('@') > 0) {
      // we have a email, find the user ID first
      return (await User.findOne({ where: { email: user } })).id;
    } else {
      return user;
    }
  }
}
