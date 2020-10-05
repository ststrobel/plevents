import { CategoryI } from '../../../common/category';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  BaseEntity,
  ManyToOne,
} from 'typeorm';
import { Tenant } from './tenant';

@Entity()
export class Category extends BaseEntity implements CategoryI {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  @ManyToOne(type => Tenant)
  tenant: Tenant;
  @Column()
  tenantId: string;
  @Column()
  name: string;
}
