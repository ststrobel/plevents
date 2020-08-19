import { EventI } from '../../../common/event';
import { Participant } from './participant';
import { BaseEntity, PrimaryGeneratedColumn, Column, Entity } from 'typeorm';

@Entity()
export class Event extends BaseEntity implements EventI {
  @PrimaryGeneratedColumn()
  id: number;
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
}
