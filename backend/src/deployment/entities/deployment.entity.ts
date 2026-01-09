import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

@Entity('deployment')
export class Deployment extends BaseEntity {
  @Column()
  name: string;

  @Column({ name: 'start_date', type: 'date' })
  startDate: Date;

  @Column({ name: 'end_date', type: 'date' })
  endDate: Date;

  @Column({ name: 'total_manpower' })
  totalManpower: number;

  @Column({ name: 'minimum_presence_percentage', default: 75 })
  minimumPresencePercentage: number;

  @Column({ name: 'minimum_rest_hours', default: 12 })
  minimumRestHours: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;
}
