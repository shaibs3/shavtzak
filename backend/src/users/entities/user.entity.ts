import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Soldier } from '../../soldiers/entities/soldier.entity';

export enum UserRole {
  COMMANDER = 'commander',
  SOLDIER = 'soldier',
}

@Entity('users')
export class User extends BaseEntity {
  @Column({ unique: true })
  username: string;

  @Column({ name: 'password_hash' })
  passwordHash: string;

  @Column({
    type: 'enum',
    enum: UserRole,
  })
  role: UserRole;

  @Column({ name: 'soldier_id', nullable: true })
  soldierId: string;

  @ManyToOne(() => Soldier, { nullable: true })
  @JoinColumn({ name: 'soldier_id' })
  soldier: Soldier;
}