import { DataSource } from 'typeorm';
import { Soldier } from '../../soldiers/entities/soldier.entity';
import { Constraint } from '../../soldiers/entities/constraint.entity';
import { Task } from '../../tasks/entities/task.entity';
import { TaskRole } from '../../tasks/entities/task-role.entity';
import { Settings } from '../../settings/entities/settings.entity';
import { Assignment } from '../../assignments/entities/assignment.entity';

export async function seed(dataSource: DataSource) {
  console.log('Starting database seed...');

  // Get repositories
  const soldierRepo = dataSource.getRepository(Soldier);
  const constraintRepo = dataSource.getRepository(Constraint);
  const taskRepo = dataSource.getRepository(Task);
  const taskRoleRepo = dataSource.getRepository(TaskRole);
  const settingsRepo = dataSource.getRepository(Settings);
  const assignmentRepo = dataSource.getRepository(Assignment);

  // Clear existing data (in reverse FK order)
  console.log('Clearing existing data...');

  // Use query builder to delete all records (respects foreign keys)
  await dataSource
    .createQueryBuilder()
    .delete()
    .from(Assignment)
    .execute();

  await dataSource
    .createQueryBuilder()
    .delete()
    .from(Constraint)
    .execute();

  await dataSource
    .createQueryBuilder()
    .delete()
    .from(TaskRole)
    .execute();

  await dataSource
    .createQueryBuilder()
    .delete()
    .from(Task)
    .execute();

  await dataSource
    .createQueryBuilder()
    .delete()
    .from(Soldier)
    .execute();

  await dataSource
    .createQueryBuilder()
    .delete()
    .from(Settings)
    .execute();

  // Create soldiers with constraints
  console.log('Creating soldiers...');

  const yossi = soldierRepo.create({
    name: 'יוסי כהן',
    rank: 'סמל',
    roles: ['driver', 'soldier'],
    maxVacationDays: 5,
    usedVacationDays: 0,
  });
  await soldierRepo.save(yossi);

  const yossiConstraint = constraintRepo.create({
    type: 'vacation',
    startDate: new Date('2024-02-10'),
    endDate: new Date('2024-02-10'),
    reason: 'חופשה',
    soldier: yossi,
  });
  await constraintRepo.save(yossiConstraint);

  const danny = soldierRepo.create({
    name: 'דני לוי',
    rank: 'רב טוראי',
    roles: ['soldier'],
    maxVacationDays: 5,
    usedVacationDays: 2,
  });
  await soldierRepo.save(danny);

  const michal = soldierRepo.create({
    name: 'מיכל אברהם',
    rank: 'סגן',
    roles: ['commander', 'soldier'],
    maxVacationDays: 7,
    usedVacationDays: 1,
  });
  await soldierRepo.save(michal);

  const michalConstraint = constraintRepo.create({
    type: 'unavailable',
    startDate: new Date('2024-02-15'),
    endDate: new Date('2024-02-15'),
    reason: 'מילואים',
    soldier: michal,
  });
  await constraintRepo.save(michalConstraint);

  console.log(`Created ${await soldierRepo.count()} soldiers`);
  console.log(`Created ${await constraintRepo.count()} constraints`);

  // Create tasks with required roles
  console.log('Creating tasks...');

  const morningTask = taskRepo.create({
    name: 'משמרת בוקר',
    description: 'משמרת בוקר 06:00-14:00',
    shiftStartHour: 6,
    shiftDuration: 8,
    restTimeBetweenShifts: 12,
    isActive: true,
  });
  await taskRepo.save(morningTask);

  const morningCommander = taskRoleRepo.create({
    role: 'commander',
    count: 1,
    task: morningTask,
  });
  await taskRoleRepo.save(morningCommander);

  const morningSoldiers = taskRoleRepo.create({
    role: 'soldier',
    count: 2,
    task: morningTask,
  });
  await taskRoleRepo.save(morningSoldiers);

  const eveningTask = taskRepo.create({
    name: 'משמרת ערב',
    description: 'משמרת ערב 14:00-22:00',
    shiftStartHour: 14,
    shiftDuration: 8,
    restTimeBetweenShifts: 12,
    isActive: true,
  });
  await taskRepo.save(eveningTask);

  const eveningDriver = taskRoleRepo.create({
    role: 'driver',
    count: 1,
    task: eveningTask,
  });
  await taskRoleRepo.save(eveningDriver);

  const eveningSoldiers = taskRoleRepo.create({
    role: 'soldier',
    count: 2,
    task: eveningTask,
  });
  await taskRoleRepo.save(eveningSoldiers);

  console.log(`Created ${await taskRepo.count()} tasks`);
  console.log(`Created ${await taskRoleRepo.count()} task roles`);

  // Create settings
  console.log('Creating settings...');

  const settings = settingsRepo.create({
    minBasePresence: 75,
    totalSoldiers: 20,
  });
  await settingsRepo.save(settings);

  console.log(`Created ${await settingsRepo.count()} settings record`);

  console.log('Seed complete!');
}
