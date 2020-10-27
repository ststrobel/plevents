import {
  PrimaryGeneratedColumn,
  Column,
  Entity,
  BaseEntity,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { Tenant } from './tenant';

@Entity()
export class Subscription extends BaseEntity {
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
  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;
}
