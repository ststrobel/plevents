import { TenantI } from '../../../common/tenant';
import { PrimaryGeneratedColumn, Column, Entity, BaseEntity } from 'typeorm';
const dotenv = require('dotenv');
dotenv.config();

@Entity()
export class Tenant extends BaseEntity implements TenantI {
  @PrimaryGeneratedColumn()
  id: number;
  @Column()
  name: string;
  @Column({ nullable: true })
  logo: string;
  @Column({ unique: true })
  path: string;
}
