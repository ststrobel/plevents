import { UserI } from '../../../common/user';
import { BaseEntity, Column, PrimaryGeneratedColumn, Entity, BeforeInsert, BeforeUpdate } from 'typeorm';
const bcrypt = require('bcrypt');

@Entity()
export class User extends BaseEntity implements UserI {
  @PrimaryGeneratedColumn()
  id: number;
  @Column()
  active: boolean;
  @Column()
  name: string;
  @Column()
  email: string;
  @Column()
  password: string;
  tenantId?: number;

  validPassword(password: string): boolean {
    return bcrypt.compare(password, this.password);
  }
  @BeforeInsert()
  @BeforeUpdate()
  encryptUserPW() {
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
/*
User.prototype.toJSON = function () {
  var values = Object.assign({}, this.get());
  delete values.password;
  return values;
};*/