import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Constraint } from './constraint.entity';

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
