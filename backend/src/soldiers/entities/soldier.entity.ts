import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Constraint } from './constraint.entity';
import { Platoon } from '../../platoons/entities/platoon.entity';

@Entity('soldiers')
export class Soldier {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  rank: string;

  @Column('simple-array')
  roles: string[];

  @Column({ type: 'int', default: 5 })
  maxVacationDays: number;

  @Column({ type: 'int', default: 0 })
  usedVacationDays: number;

  @ManyToOne(() => Platoon, (platoon) => platoon.soldiers, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'platoonId' })
  platoon: Platoon | null;

  @Column({ type: 'uuid', nullable: true })
  platoonId: string | null;

  @OneToMany(() => Constraint, (constraint) => constraint.soldier, {
    cascade: true,
    eager: true,
  })
  constraints: Constraint[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
