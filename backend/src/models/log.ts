import { Entity, PrimaryGeneratedColumn, Column, BaseEntity, OneToMany, ManyToOne } from "typeorm";
import { User } from "./user";
import { Tenant } from "./tenant";

@Entity()
export class Log extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne((type) => Tenant, { cascade: true, onDelete: "NO ACTION" })
  tenant: Tenant;

  @Column()
  userId: number;

  @Column()
  message: string;

  static write(user: string | number, message: string) {
    if (typeof user === "string") {
      // we have a username, find the user ID first
      User.findOne({ where: { username: user } }).then((user: User) => {
        const log = new Log();
        log.message = message;
        log.userId = user.id;
        log.save();
      });
    } else if (typeof user === "number") {
      const log = new Log();
      log.message = message;
      log.userId = user;
      log.save();
    }
  }
}
