import {
  PrimaryGeneratedColumn,
  Column,
  Entity,
  BaseEntity,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { Tenant } from './tenant';
import { SubscriptionI } from '../../../common/subscription';

@Entity()
export class Subscription extends BaseEntity implements SubscriptionI {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  @ManyToOne(type => Tenant)
  tenant: Tenant;
  @Column()
  tenantId: string;
  @Column()
  months: number;
  @Column()
  pricePerMonth: number;
  @Column({ nullable: true })
  paid: Date = null;
  @Column({ nullable: true })
  paymentLink: string = null;
  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;
}
