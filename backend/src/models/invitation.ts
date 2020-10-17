import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  BaseEntity,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { Tenant } from './tenant';

@Entity()
export class Invitation extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  @ManyToOne(type => Tenant, { cascade: true, onDelete: 'CASCADE' })
  tenant: Tenant;
  @Column()
  tenantId: string;
  @Column()
  email: string;
  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;
}
