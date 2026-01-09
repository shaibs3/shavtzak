import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Shift } from './shift.entity';
import { Soldier } from '../../soldiers/entities/soldier.entity';

export enum AssignmentRole {
  COMMANDER = 'commander',
  DRIVER = 'driver',
  SPECIALIST = 'specialist',
  GENERAL = 'general',
}

@Entity('shift_assignments')
export class ShiftAssignment extends BaseEntity {
  @Column({ name: 'shift_id' })
  shiftId: string;

  @ManyToOne(() => Shift, shift => shift.assignments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'shift_id' })
  shift: Shift;

  @Column({ name: 'soldier_id' })
  soldierId: string;

  @ManyToOne(() => Soldier)
  @JoinColumn({ name: 'soldier_id' })
  soldier: Soldier;

  @Column({
    type: 'enum',
    enum: AssignmentRole,
  })
  role: AssignmentRole;

  @Column({ name: 'assigned_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  assignedAt: Date;
}
