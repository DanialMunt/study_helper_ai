import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Billing {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column('float')
  amount: number;
}
