import { UserI } from '../../../common/user';
import { BaseEntity, Column, PrimaryGeneratedColumn, Entity, BeforeInsert, BeforeUpdate, ManyToOne } from 'typeorm';
import { Tenant } from './tenant';
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
  @Column({select: false})
  password: string;
  @ManyToOne((type) => Tenant, { cascade: true, onDelete: "CASCADE", eager: true })
  tenant: Tenant;

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
/*
User.prototype.toJSON = function () {
  var values = Object.assign({}, this.get());
  delete values.password;
  return values;
};*/