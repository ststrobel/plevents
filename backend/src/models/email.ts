import { EmailI } from '../../../common/email';
import { Entity, PrimaryGeneratedColumn, Column, BaseEntity } from "typeorm";

@Entity()
export class Email extends BaseEntity implements EmailI {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  address: string;
}
      
