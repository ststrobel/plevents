import { CategoryI } from '../../../common/category';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  BaseEntity,
  ManyToOne,
  Unique,
} from 'typeorm';
import { Tenant } from './tenant';

@Entity()
@Unique(['tenantId', 'name'])
export class Category extends BaseEntity implements CategoryI {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  @ManyToOne(type => Tenant, { cascade: true, onDelete: 'CASCADE' })
  tenant: Tenant;
  @Column()
  tenantId: string;
  @Column()
  name: string;
}
