import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { TaskRole } from './task-role.entity';

@Entity('tasks')
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ type: 'int' })
  shiftStartHour: number;

  @Column({ type: 'int' })
  shiftDuration: number;

  @Column({ type: 'int' })
  restTimeBetweenShifts: number;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => TaskRole, (taskRole) => taskRole.task, {
    cascade: true,
    eager: true,
  })
  requiredRoles: TaskRole[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
