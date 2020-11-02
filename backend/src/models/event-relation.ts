import {
  BaseEntity,
  Column,
  PrimaryGeneratedColumn,
  Entity,
  ManyToOne,
  Unique,
} from 'typeorm';
import { User } from './user';
import { EventRelationI } from '../../../common/event-relation';
import { Event } from './event';
import { EventSeries } from './event-series';

@Entity()
export class EventRelation extends BaseEntity implements EventRelationI {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  @ManyToOne(type => User, { cascade: true, onDelete: 'CASCADE' })
  user: User;
  @Column()
  userId: string;
  @ManyToOne(type => Event, {
    cascade: true,
    nullable: true,
    onDelete: 'CASCADE',
  })
  event: Event;
  @Column({ nullable: true })
  eventId: string;
  @ManyToOne(type => EventSeries, {
    cascade: true,
    nullable: true,
    onDelete: 'CASCADE',
  })
  eventSeries: EventSeries;
  @Column({ nullable: true })
  eventSeriesId: string;
}
