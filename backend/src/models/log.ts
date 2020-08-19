import { Entity, PrimaryGeneratedColumn, Column, BaseEntity } from "typeorm";
import { type } from "os";
import { User } from "./user";
import { UserService } from "../services/user.service";

@Entity()
export class Log extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column()
  message: string;

  static write(user: string | number, message: string) {
    if (typeof user === 'string') {
      // we have a username, find the user ID first
      User.findOne({ where: { username: user } }).then((user: User) => {
        const log = new Log();
        log.message = message;
        log.userId = user.id;
        log.save();
      });
    } else if(typeof user === 'number') {
      const log = new Log();
      log.message = message;
      log.userId = user;
      log.save();
    }
  }
}
