import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

@Entity('soldiers')
export class Soldier extends BaseEntity {
  @Column()
  name: string;

  @Column()
  rank: string;

  @Column({ name: 'is_commander', default: false })
  isCommander: boolean;

  @Column({ name: 'is_driver', default: false })
  isDriver: boolean;

  @Column({ name: 'is_specialist', default: false })
  isSpecialist: boolean;

  @Column({ name: 'vacation_quota_days', default: 20 })
  vacationQuotaDays: number;

  @Column({ name: 'vacation_days_used', default: 0 })
  vacationDaysUsed: number;
}
