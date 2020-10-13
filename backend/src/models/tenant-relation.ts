import {
  BaseEntity,
  Column,
  PrimaryGeneratedColumn,
  Entity,
  ManyToOne,
  Unique,
} from 'typeorm';
import { Tenant } from './tenant';
import { User } from './user';
import { TenantRelationI } from '../../../common/tenant-relation';

@Entity()
@Unique(['user', 'tenant'])
export class TenantRelation extends BaseEntity implements TenantRelationI {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  @Column()
  active: boolean;
  @ManyToOne(type => User, { cascade: true, onDelete: 'CASCADE' })
  user: User;
  @Column()
  userId: string;
  @ManyToOne(type => Tenant, { cascade: true, onDelete: 'CASCADE' })
  tenant: Tenant;
  @Column()
  tenantId: string;
}
