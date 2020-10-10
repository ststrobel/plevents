import { ParticipantI } from '../../../common/participant';
import {
  BaseEntity,
  PrimaryGeneratedColumn,
  Column,
  Entity,
  ManyToOne,
} from 'typeorm';
import { Event } from './event';

@Entity()
export class Participant extends BaseEntity implements ParticipantI {
  @PrimaryGeneratedColumn()
  id: number;
  @Column()
  email: string;
  @Column()
  phone: string;
  @Column({ nullable: true })
  firstname: string;
  @Column({ nullable: true })
  lastname: string;
  @Column({ nullable: true })
  name: string;
  @Column()
  street: string;
  @Column()
  zip: string;
  @Column()
  city: string;
  @ManyToOne(type => Event, { cascade: true, onDelete: 'CASCADE' })
  event: Event;
  @Column()
  eventId: string;
}
