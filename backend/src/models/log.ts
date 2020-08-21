import { Entity, PrimaryGeneratedColumn, Column, BaseEntity, OneToMany, ManyToOne } from "typeorm";
import { User } from "./user";
import { Tenant } from "./tenant";

@Entity()
export class Log extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  tenantId: number;

  @Column()
  userId: number;

  @Column()
  message: string;

  static async write(tenant: number | Promise<Tenant>, user: string | number, message: string) {
    const log = new Log();
    log.message = message;
    log.userId = await Log.resolveUser(user);
    if (typeof tenant === "number") {
      log.tenantId = tenant;
    } else {
      log.tenantId = (await tenant).id;
    }
    log.save();
  }

  /**
   * based on an ID or email address, resolve the ID of the user
   * @param user 
   */
  private static async resolveUser(user: string | number): Promise<number> {
    if (typeof user === "string") {
      // we have a email, find the user ID first
      return (await User.findOne({ where: { email: user } })).id;
    } else if (typeof user === "number") {
      return user;
    }
  }
}
