import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Task } from './task.entity';

@Entity('task_roles')
export class TaskRole {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  role: string;

  @Column({ type: 'int' })
  count: number;

  @ManyToOne(() => Task, (task) => task.requiredRoles, {
    onDelete: 'CASCADE',
  })
  task: Task;
}
