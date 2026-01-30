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

  // Create 70 soldiers with constraints
  console.log('Creating 70 soldiers...');

  const firstNames = [
    'יוסי', 'דני', 'מיכל', 'שרון', 'עומר', 'רון', 'תומר', 'אורי', 'עידו', 'נועם',
    'יונתן', 'אביב', 'גיא', 'שחר', 'לירון', 'איתי', 'רועי', 'דור', 'עדי', 'נתנאל',
    'אלעד', 'אלון', 'יניב', 'אסף', 'עמית', 'שי', 'טל', 'ליאור', 'אביגיל', 'נועה',
    'שירה', 'מאיה', 'רותם', 'יעל', 'תמר', 'הדר', 'ענבר', 'שני', 'ליהי', 'מור',
    'אדם', 'בן', 'דניאל', 'אייל', 'גל', 'יואב', 'עופר', 'צח', 'שמעון', 'אריאל',
    'יהודה', 'משה', 'אברהם', 'יצחק', 'יעקב', 'דוד', 'שלמה', 'אליהו', 'אהרון', 'מרים',
    'רחל', 'לאה', 'שרה', 'רבקה', 'דינה', 'חנה', 'רות', 'אסתר', 'יהושע', 'כלב'
  ];

  const lastNames = [
    'כהן', 'לוי', 'אברהם', 'מזרחי', 'דהן', 'ביטון', 'שמעון', 'פרץ', 'משה', 'חזן',
    'אוחיון', 'בן דוד', 'יוסף', 'ברוך', 'ששון', 'מלכה', 'עזרא', 'חיים', 'אליהו', 'שלום',
    'ישראל', 'אהרון', 'בוזגלו', 'עמר', 'אזולאי', 'אלון', 'בר', 'גולן', 'דגן', 'זהבי',
    'חן', 'טל', 'יפה', 'כץ', 'לוין', 'מור', 'נחום', 'סער', 'עוז', 'פז'
  ];

  const ranks = ['טוראי', 'רב טוראי', 'סמל', 'סמל ראשון', 'רס"ל', 'רס"ר', 'סגן', 'סרן'];

  const allRoles = [
    ['soldier'],
    ['soldier'],
    ['soldier'],
    ['driver', 'soldier'],
    ['driver', 'soldier'],
    ['radio_operator', 'soldier'],
    ['radio_operator', 'soldier'],
    ['commander', 'soldier'],
  ];

  const constraintTypes = ['vacation', 'unavailable', 'medical'];
  const constraintReasons = ['חופשה', 'מילואים', 'מחלה', 'יציאה', 'אירוע משפחתי'];

  const soldiers: Soldier[] = [];

  for (let i = 0; i < 70; i++) {
    const firstName = firstNames[i % firstNames.length];
    const lastName = lastNames[Math.floor(i / firstNames.length) % lastNames.length];
    const rank = ranks[Math.floor(Math.random() * ranks.length)];
    const roles = allRoles[Math.floor(Math.random() * allRoles.length)];
    const maxVacationDays = Math.floor(Math.random() * 5) + 5; // 5-9 days
    const usedVacationDays = Math.floor(Math.random() * (maxVacationDays / 2)); // 0 to half used

    const soldier = soldierRepo.create({
      name: `${firstName} ${lastName}`,
      rank,
      roles,
      maxVacationDays,
      usedVacationDays,
    });
    await soldierRepo.save(soldier);
    soldiers.push(soldier);

    // Add constraint to ~20% of soldiers
    if (Math.random() < 0.2) {
      const daysOffset = Math.floor(Math.random() * 30) - 15; // -15 to +15 days from today
      const constraintDate = new Date();
      constraintDate.setDate(constraintDate.getDate() + daysOffset);

      const constraint = constraintRepo.create({
        type: constraintTypes[Math.floor(Math.random() * constraintTypes.length)],
        startDate: constraintDate,
        endDate: constraintDate,
        reason: constraintReasons[Math.floor(Math.random() * constraintReasons.length)],
        soldier: soldier,
      });
      await constraintRepo.save(constraint);
    }
  }

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
    totalSoldiers: 70,
    operationalStartDate: new Date('2026-02-01'),
    operationalEndDate: new Date('2026-05-31'),
  });
  await settingsRepo.save(settings);

  console.log(`Created ${await settingsRepo.count()} settings record`);

  console.log('Seed complete!');
}
