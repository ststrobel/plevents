import { EventSeriesI } from '../../../common/event-series';
import {
  BaseEntity,
  PrimaryGeneratedColumn,
  Column,
  Entity,
  ManyToOne,
} from 'typeorm';
import { Tenant } from './tenant';
import { Category } from './category';

@Entity()
export class EventSeries extends BaseEntity implements EventSeriesI {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  @Column()
  name: string;
  @ManyToOne(type => Category, {
    nullable: true,
    cascade: true,
    onDelete: 'SET NULL',
  })
  category: Category;
  @Column({ nullable: true })
  categoryId: string;
  @ManyToOne(type => Tenant, { cascade: true, onDelete: 'CASCADE' })
  tenant: Tenant;
  @Column()
  tenantId: string;
}
