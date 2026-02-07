import { DataSource } from 'typeorm';
import { Settings } from '../settings/entities/settings.entity';
import { Soldier } from '../soldiers/entities/soldier.entity';
import { Constraint } from '../soldiers/entities/constraint.entity';
import { Task } from '../tasks/entities/task.entity';
import { TaskRole } from '../tasks/entities/task-role.entity';
import { Assignment } from '../assignments/entities/assignment.entity';
import { Platoon } from '../platoons/entities/platoon.entity';
import { User } from '../users/entities/user.entity';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'shavtzak',
  entities: [Settings, Soldier, Constraint, Task, TaskRole, Assignment, Platoon, User],
  migrations: ['src/database/migrations/*.ts'],
  synchronize: false,
  logging: true,
});
