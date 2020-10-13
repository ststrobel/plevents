import { UserI } from '../../../common/user';
import {
  BaseEntity,
  Column,
  PrimaryGeneratedColumn,
  Entity,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
const bcrypt = require('bcrypt');

@Entity()
export class User extends BaseEntity implements UserI {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  @Column()
  active: boolean = true;
  @Column()
  name: string;
  @Column({ unique: true })
  email: string;
  @Column({ select: false })
  password: string;

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
