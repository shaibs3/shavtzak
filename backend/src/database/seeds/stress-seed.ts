import { DataSource, DataSourceOptions } from 'typeorm';
import { Soldier } from '../../soldiers/entities/soldier.entity';
import { Constraint } from '../../soldiers/entities/constraint.entity';
import { Task } from '../../tasks/entities/task.entity';
import { Assignment } from '../../assignments/entities/assignment.entity';
import { Platoon } from '../../platoons/entities/platoon.entity';
import { Settings } from '../../settings/entities/settings.entity';
import { addDays, addWeeks, startOfWeek } from 'date-fns';
import { seed } from './seed';
import { databaseConfig } from '../../config/database.config';

/**
 * Stress seed: runs the base seed first, then applies edge-case modifications.
 *
 * Scenarios:
 * 1. Scarce commanders (only 3 total, 2 in platoon א')
 * 2. Religious Friday constraints (2 soldiers, every Fri-Sat for 17 weeks)
 * 3. Holiday cluster in week 6 (20 soldiers on vacation same week)
 * 4. Mid-rotation injury (1 driver in platoon ג', medical weeks 3-7)
 * 5. Overworked soldier (1 soldier with pre-existing assignment hours)
 * 6. Undermanned platoon (platoon ה' reduced to 6 soldiers)
 */
export async function stressSeed(dataSource: DataSource) {
  // Step 1: Run base seed
  await seed(dataSource);

  const soldierRepo = dataSource.getRepository(Soldier);
  const constraintRepo = dataSource.getRepository(Constraint);
  const taskRepo = dataSource.getRepository(Task);
  const platoonRepo = dataSource.getRepository(Platoon);
  const settingsRepo = dataSource.getRepository(Settings);
  const assignmentRepo = dataSource.getRepository(Assignment);

  const platoons = await platoonRepo.find({ order: { name: 'ASC' } });
  const soldiers = await soldierRepo.find({ relations: ['platoon'] });
  const tasks = await taskRepo.find({ relations: ['requiredRoles'] });
  const settings = await settingsRepo.find();
  const operationalStart = settings[0]?.operationalStartDate
    ? new Date(settings[0].operationalStartDate)
    : new Date('2026-02-01');

  // --- Scenario 1: Scarce commanders ---
  // Remove commander role from all soldiers, then add to exactly 3
  await soldierRepo
    .createQueryBuilder()
    .update()
    .set({ roles: () => "array_remove(roles, 'commander')" })
    .where("'commander' = ANY(roles)")
    .execute();

  const platoonAleph = platoons[0];
  const platoonBet = platoons[1];
  const platoonGimel = platoons[2];

  const alephSoldiers = soldiers.filter(
    (s) => s.platoon?.id === platoonAleph?.id,
  );
  const betSoldiers = soldiers.filter((s) => s.platoon?.id === platoonBet?.id);

  if (alephSoldiers.length >= 2) {
    for (const s of alephSoldiers.slice(0, 2)) {
      const roles = [...new Set([...s.roles, 'commander'])];
      await soldierRepo.update(s.id, { roles });
    }
  }
  if (betSoldiers.length >= 1) {
    const roles = [...new Set([...betSoldiers[0].roles, 'commander'])];
    await soldierRepo.update(betSoldiers[0].id, { roles });
  }

  // --- Scenario 2: Religious Friday constraints ---
  const religiousSoldiers = soldiers.slice(0, 2);
  for (const soldier of religiousSoldiers) {
    for (let week = 0; week < 17; week++) {
      const weekStart = addWeeks(operationalStart, week);
      const friday = addDays(startOfWeek(weekStart, { weekStartsOn: 0 }), 5);
      const saturday = addDays(friday, 1);

      const constraint = constraintRepo.create({
        type: 'unavailable',
        reason: 'שבת - דתי',
        startDate: friday,
        endDate: saturday,
        soldier: soldier,
      });
      await constraintRepo.save(constraint);
    }
  }

  // --- Scenario 3: Holiday cluster in week 6 ---
  const week6Start = addWeeks(operationalStart, 5);
  const week6End = addDays(week6Start, 6);
  const holidaySoldiers = soldiers.slice(5, 25);
  for (const soldier of holidaySoldiers) {
    const constraint = constraintRepo.create({
      type: 'vacation',
      reason: 'חופשת חג',
      startDate: week6Start,
      endDate: week6End,
      soldier: soldier,
    });
    await constraintRepo.save(constraint);
  }

  // --- Scenario 4: Mid-rotation injury ---
  const gimelSoldiers = soldiers.filter(
    (s) => s.platoon?.id === platoonGimel?.id,
  );
  const driverInGimel = gimelSoldiers.find((s) => s.roles.includes('driver'));
  if (driverInGimel) {
    const week3Start = addWeeks(operationalStart, 2);
    const week7End = addDays(addWeeks(operationalStart, 6), 6);
    const constraint = constraintRepo.create({
      type: 'medical',
      reason: 'פציעה באימון',
      startDate: week3Start,
      endDate: week7End,
      soldier: driverInGimel,
    });
    await constraintRepo.save(constraint);
  }

  // --- Scenario 5: Overworked soldier ---
  const overworkedSoldier = soldiers[30];
  const morningTask = tasks.find((t) => t.shiftStartHour === 6);
  if (overworkedSoldier && morningTask) {
    for (let i = 0; i < 3; i++) {
      const day = addDays(operationalStart, i);
      const startTime = new Date(day);
      startTime.setHours(6, 0, 0, 0);
      const endTime = new Date(day);
      endTime.setHours(14, 0, 0, 0);

      const assignment = assignmentRepo.create({
        taskId: morningTask.id,
        soldierId: overworkedSoldier.id,
        role: 'soldier',
        startTime,
        endTime,
        locked: false,
      });
      await assignmentRepo.save(assignment);
    }
  }

  // --- Scenario 6: Undermanned platoon ---
  const platoonHe = platoons[4];
  if (platoonHe) {
    const heSoldiers = soldiers.filter((s) => s.platoon?.id === platoonHe.id);
    const toRemove = heSoldiers.slice(6);
    for (const soldier of toRemove) {
      await soldierRepo.update(soldier.id, { platoon: null });
    }
  }

  console.log('Stress seed applied:');
  console.log("  - 3 commanders only (2 in platoon א', 1 in platoon ב')");
  console.log('  - 2 soldiers with religious Friday constraints (17 weeks)');
  console.log('  - 20 soldiers on vacation in week 6 (holiday cluster)');
  console.log("  - 1 driver in platoon ג' injured weeks 3-7");
  console.log('  - 1 soldier with pre-existing assignment hours');
  console.log("  - Platoon ה' reduced to 6 soldiers");
}

// Run if called directly
async function runStressSeed() {
  const dataSource = new DataSource(databaseConfig as DataSourceOptions);

  try {
    console.log('Initializing database connection...');
    await dataSource.initialize();
    console.log('Database connection established');

    await stressSeed(dataSource);

    console.log('\nStress seed completed successfully!');
  } catch (error) {
    console.error('Stress seed failed:', error);
    process.exit(1);
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
      console.log('Database connection closed');
    }
  }
}

void runStressSeed();
