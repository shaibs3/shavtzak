import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Soldier } from '../../soldiers/entities/soldier.entity';

@Entity('platoons')
export class Platoon {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 100 })
  name: string;

  @Column({ nullable: true, length: 100 })
  commander: string | null;

  @Column({ length: 7 })
  color: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  // Note: Relation will be fully established when Soldier entity is updated in Task 2
  // For now, this allows the Platoon entity to be created
  @OneToMany(() => Soldier, (soldier) => soldier['platoon'], { nullable: true })
  soldiers: Soldier[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
