import { Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn } from 'typeorm';

@Entity('settings')
export class Settings {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'int' })
  minBasePresence: number;

  @Column({ type: 'int' })
  totalSoldiers: number;

  @UpdateDateColumn()
  updatedAt: Date;
}
