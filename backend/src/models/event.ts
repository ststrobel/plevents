import { EventI } from '../../../common/event';
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
export class Event extends BaseEntity implements EventI {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  @Column()
  name: string;
  @Column()
  date: Date;
  @Column()
  maxSeats: number;
  @Column()
  takenSeats: number;
  @Column()
  singleOccurence: boolean;
  @Column({ nullable: true })
  registrationOpenFrom: Date;
  @Column()
  disabled: boolean;
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
