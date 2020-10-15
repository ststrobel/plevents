import {
  PrimaryGeneratedColumn,
  Column,
  Entity,
  BaseEntity,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { User } from './user';

export enum VerificationType {
  REGISTRATION = 'register',
  PASSWORD_RESET = 'password',
  USER_TENANT_CONNECTION = 'join',
}

@Entity()
export class Verification extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  @Column()
  code: string = uuidv4();
  @ManyToOne(type => User, { cascade: true, onDelete: 'CASCADE' })
  user: User;
  @Column()
  userId: string;
  @Column({
    type: 'enum',
    enum: VerificationType,
  })
  type: VerificationType;
  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;
  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
