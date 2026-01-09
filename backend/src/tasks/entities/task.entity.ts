import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

@Entity('tasks')
export class Task extends BaseEntity {
  @Column()
  name: string;

  @Column()
  type: string;

  @Column({ name: 'commanders_needed', default: 0 })
  commandersNeeded: number;

  @Column({ name: 'drivers_needed', default: 0 })
  driversNeeded: number;

  @Column({ name: 'specialists_needed', default: 0 })
  specialistsNeeded: number;

  @Column({ name: 'general_soldiers_needed', default: 0 })
  generalSoldiersNeeded: number;

  @Column({ name: 'shift_duration_hours' })
  shiftDurationHours: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;
}
