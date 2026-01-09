import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Soldier } from '../../soldiers/entities/soldier.entity';

@Entity('leave_records')
export class LeaveRecord extends BaseEntity {
  @Column({ name: 'soldier_id' })
  soldierId: string;

  @ManyToOne(() => Soldier)
  @JoinColumn({ name: 'soldier_id' })
  soldier: Soldier;

  @Column({ name: 'start_date', type: 'date' })
  startDate: Date;

  @Column({ name: 'end_date', type: 'date' })
  endDate: Date;

  @Column({ type: 'text', nullable: true })
  reason: string;

  @Column({ name: 'entered_by' })
  enteredBy: string;

  @ManyToOne(() => Soldier)
  @JoinColumn({ name: 'entered_by' })
  enteredByUser: Soldier;
}
