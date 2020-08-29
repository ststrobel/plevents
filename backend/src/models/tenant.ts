import { TenantI } from '../../../common/tenant';
import { PrimaryGeneratedColumn, Column, Entity, BaseEntity } from 'typeorm';
const dotenv = require('dotenv');
dotenv.config();

@Entity()
export class Tenant extends BaseEntity implements TenantI {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  @Column()
  name: string;
  @Column({ nullable: true, length: 1000000 })
  logo: string;
  @Column({ unique: true })
  path: string;
  @Column({ nullable: true, length: 10000 })
  consentText: string;
}
