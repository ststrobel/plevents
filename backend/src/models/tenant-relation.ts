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
import { ROLE, TenantRelationI } from '../../../common/tenant-relation';

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
  @Column({
    type: 'enum',
    enum: ROLE,
    default: ROLE.MEMBER,
  })
  role: ROLE;

  hasRole(roleName: string): boolean {
    if (this.role === ROLE.OWNER) return true;
    if (this.role === ROLE.ADMIN && roleName !== ROLE.OWNER) return true;
    return false;
  }
}
