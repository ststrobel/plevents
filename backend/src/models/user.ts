import { UserI } from '../../../common/user';
import {
  BaseEntity,
  Column,
  PrimaryGeneratedColumn,
  Entity,
  BeforeInsert,
  BeforeUpdate,
  OneToMany,
} from 'typeorm';
import { EventRelation } from './event-relation';
const bcrypt = require('bcrypt');

@Entity()
export class User extends BaseEntity implements UserI {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  @Column()
  active: boolean = false;
  @Column()
  name: string;
  @Column({ unique: true })
  email: string;
  @Column({ select: false })
  password: string;
  @OneToMany(() => EventRelation, relation => relation.user, { eager: true })
  eventRelations: EventRelation[];

  async validPassword(password: string): Promise<boolean> {
    return await bcrypt.compare(password, this.password);
  }
  @BeforeInsert()
  @BeforeUpdate()
  encryptUserPW() {
    if (this.password) {
      return bcrypt
        .hash(this.password, 10)
        .then((hash: any) => {
          this.password = hash;
        })
        .catch((error: any) => {
          throw new Error(error);
        });
    }
  }
}
