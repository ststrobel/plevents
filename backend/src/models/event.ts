import { EventI } from '../../../common/event';
import {
  BaseEntity,
  PrimaryGeneratedColumn,
  Column,
  Entity,
  ManyToOne,
} from 'typeorm';
import { Tenant } from './tenant';

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
  disabled: boolean;
  @Column()
  targetClass: string;
  @ManyToOne(type => Tenant, { cascade: true, onDelete: 'CASCADE' })
  tenant: Tenant;
  @Column()
  tenantId: string;
}
