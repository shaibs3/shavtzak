import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
} from 'typeorm';
import { Soldier } from './soldier.entity';

@Entity('constraints')
export class Constraint {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  type: string;

  @Column({ type: 'date' })
  startDate: Date;

  @Column({ type: 'date' })
  endDate: Date;

  @Column({ nullable: true })
  reason: string;

  @ManyToOne(() => Soldier, (soldier) => soldier.constraints, {
    onDelete: 'CASCADE',
  })
  soldier: Soldier;

  @CreateDateColumn()
  createdAt: Date;
}
