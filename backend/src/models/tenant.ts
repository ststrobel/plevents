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
  @Column({ type: 'longtext', nullable: true })
  logo: string;
  @Column({ unique: true })
  path: string;
  @Column({ nullable: true, length: '1000' })
  consentTeaser1: string;
  @Column({ type: 'mediumtext', nullable: true })
  consentText1: string;
  @Column({ nullable: true, length: '1000' })
  consentTeaser2: string;
  @Column({ type: 'mediumtext', nullable: true })
  consentText2: string;
}
