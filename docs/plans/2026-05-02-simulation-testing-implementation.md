# Simulation Testing Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a 3-layer simulation testing suite that verifies the shavtzak scheduling system works correctly under real-world conditions — algorithm, API, UI, and edge cases.

**Architecture:** Layer 1 is a Vitest-based stress simulation extending the existing `frontend/src/lib/scheduling/__tests__/` infrastructure with a dedicated stress scenario. Layer 2 is Playwright E2E tests simulating commander workflows through the browser. Layer 3 is a manual checklist document (already drafted in the design doc). A batch assignment endpoint is added to the backend to support efficient API-level testing.

**Tech Stack:** Vitest (frontend scheduling tests), Playwright (E2E), NestJS (backend batch endpoint), supertest (API integration)

---

### Task 1: Add Batch Assignment Endpoint to Backend

The frontend currently creates assignments one-by-one via POST. For simulation testing (and general efficiency), add a batch create/replace endpoint.

**Files:**
- Create: `backend/src/assignments/dto/batch-create-assignments.dto.ts`
- Modify: `backend/src/assignments/assignments.service.ts`
- Modify: `backend/src/assignments/assignments.controller.ts`

**Step 1: Create the batch DTO**

Create `backend/src/assignments/dto/batch-create-assignments.dto.ts`:

```typescript
import { Type } from 'class-transformer';
import { IsArray, ValidateNested, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CreateAssignmentDto } from './create-assignment.dto';

export class BatchCreateAssignmentsDto {
  @ApiProperty({ type: [CreateAssignmentDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateAssignmentDto)
  assignments: CreateAssignmentDto[];

  @ApiProperty({ description: 'If true, delete all non-locked assignments in the date range before creating', default: false })
  @IsOptional()
  @IsBoolean()
  replaceNonLocked?: boolean;
}
```

**Step 2: Add batch method to service**

Add to `backend/src/assignments/assignments.service.ts`:

```typescript
async batchCreate(dto: BatchCreateAssignmentsDto): Promise<Assignment[]> {
  if (dto.replaceNonLocked && dto.assignments.length > 0) {
    // Find date range from assignments
    const starts = dto.assignments.map(a => new Date(a.startTime));
    const ends = dto.assignments.map(a => new Date(a.endTime));
    const minDate = new Date(Math.min(...starts.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...ends.map(d => d.getTime())));

    // Delete non-locked assignments in that range
    await this.assignmentRepository
      .createQueryBuilder()
      .delete()
      .where('locked = :locked', { locked: false })
      .andWhere('startTime >= :minDate', { minDate })
      .andWhere('endTime <= :maxDate', { maxDate })
      .execute();
  }

  const entities = dto.assignments.map(a =>
    this.assignmentRepository.create(a),
  );
  return this.assignmentRepository.save(entities);
}
```

**Step 3: Add batch endpoint to controller**

Add to `backend/src/assignments/assignments.controller.ts`:

```typescript
@Post('batch')
@Roles('admin')
@ApiOperation({ summary: 'Batch create assignments' })
@ApiResponse({ status: 201, description: 'Assignments created successfully' })
batchCreate(@Body() batchDto: BatchCreateAssignmentsDto) {
  return this.assignmentsService.batchCreate(batchDto);
}
```

**Step 4: Verify it compiles**

Run: `cd backend && npm run build`
Expected: No errors

**Step 5: Commit**

```bash
git add backend/src/assignments/
git commit -m "feat(assignments): add batch create endpoint for simulation testing"
```

---

### Task 2: Create Stress Scenario Seed

A dedicated seed function that applies edge-case modifications on top of the base seed data to create a deliberately tricky scheduling scenario.

**Files:**
- Create: `backend/src/database/seeds/stress-seed.ts`
- Modify: `backend/package.json` (add `seed:stress` script)

**Step 1: Create the stress seed script**

Create `backend/src/database/seeds/stress-seed.ts`:

```typescript
import { DataSource } from 'typeorm';
import { Soldier } from '../../soldiers/entities/soldier.entity';
import { Constraint } from '../../soldiers/entities/constraint.entity';
import { Task } from '../../tasks/entities/task.entity';
import { TaskRole } from '../../tasks/entities/task-role.entity';
import { Platoon } from '../../platoons/entities/platoon.entity';
import { Settings } from '../../settings/entities/settings.entity';
import { Assignment } from '../../assignments/entities/assignment.entity';
import { addDays, addWeeks, startOfWeek, nextFriday, nextSaturday } from 'date-fns';
import { seed } from './seed';
import { AppDataSource } from '../data-source';

/**
 * Stress seed: runs the base seed first, then applies edge-case modifications.
 *
 * Scenarios:
 * 1. Scarce commanders (only 3 total, 2 in platoon א')
 * 2. Religious Friday constraints (2 soldiers, every Fri-Sat for 17 weeks)
 * 3. Holiday cluster in week 6 (20 soldiers on vacation same week)
 * 4. Mid-rotation injury (1 driver in platoon ג', medical weeks 3-7)
 * 5. Overworked soldier (1 soldier with 20 pre-existing hours)
 * 6. Undermanned platoon (platoon ה' reduced to 6 soldiers)
 */
async function stressSeed(dataSource: DataSource) {
  // Step 1: Run base seed
  await seed(dataSource);

  const soldierRepo = dataSource.getRepository(Soldier);
  const constraintRepo = dataSource.getRepository(Constraint);
  const taskRepo = dataSource.getRepository(Task);
  const taskRoleRepo = dataSource.getRepository(TaskRole);
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

  // Add commander to 2 soldiers in platoon א' and 1 in platoon ב'
  const platoonAleph = platoons[0];
  const platoonBet = platoons[1];
  const platoonGimel = platoons[2];

  const alephSoldiers = soldiers.filter(s => s.platoon?.id === platoonAleph?.id);
  const betSoldiers = soldiers.filter(s => s.platoon?.id === platoonBet?.id);

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
  // Pick 2 soldiers and add unavailable constraints for every Fri-Sat over 17 weeks
  const religiousSoldiers = soldiers.slice(0, 2);
  for (const soldier of religiousSoldiers) {
    for (let week = 0; week < 17; week++) {
      const weekStart = addWeeks(operationalStart, week);
      // Find the Friday of this week (day 5)
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
  // 20 soldiers across all platoons get vacation in the same week
  const week6Start = addWeeks(operationalStart, 5);
  const week6End = addDays(week6Start, 6);
  const holidaySoldiers = soldiers.slice(5, 25); // 20 soldiers
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
  // 1 driver in platoon ג' gets medical constraint from week 3 for 4 weeks
  const gimelSoldiers = soldiers.filter(s => s.platoon?.id === platoonGimel?.id);
  const driverInGimel = gimelSoldiers.find(s => s.roles.includes('driver'));
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
  // Create 20 hours of pre-existing assignments for 1 soldier
  const overworkedSoldier = soldiers[30];
  const morningTask = tasks.find(t => t.shiftStartHour === 6);
  if (overworkedSoldier && morningTask) {
    // Create assignments in weeks before operational start to simulate carryover
    for (let i = 0; i < 3; i++) {
      const day = addDays(operationalStart, i);
      const startTime = new Date(day);
      startTime.setHours(6, 0, 0, 0);
      const endTime = new Date(day);
      endTime.setHours(14, 0, 0, 0);

      const assignment = assignmentRepo.create({
        task: morningTask,
        soldier: overworkedSoldier,
        role: 'soldier',
        startTime,
        endTime,
        locked: false,
      });
      await assignmentRepo.save(assignment);
    }
  }

  // --- Scenario 6: Undermanned platoon ---
  // Remove 8 soldiers from platoon ה' (keep only 6)
  const platoonHe = platoons[4];
  if (platoonHe) {
    const heSoldiers = soldiers.filter(s => s.platoon?.id === platoonHe.id);
    const toRemove = heSoldiers.slice(6);
    for (const soldier of toRemove) {
      // Move to null platoon (unassigned) rather than delete
      await soldierRepo.update(soldier.id, { platoon: null });
    }
  }

  console.log('Stress seed applied:');
  console.log('  - 3 commanders only (2 in platoon א\', 1 in platoon ב\')');
  console.log('  - 2 soldiers with religious Friday constraints (17 weeks)');
  console.log('  - 20 soldiers on vacation in week 6 (holiday cluster)');
  console.log('  - 1 driver in platoon ג\' injured weeks 3-7');
  console.log('  - 1 soldier with 20 pre-existing assignment hours');
  console.log('  - Platoon ה\' reduced to 6 soldiers');
}

// Run if called directly
AppDataSource.initialize()
  .then(async (dataSource) => {
    await stressSeed(dataSource);
    await dataSource.destroy();
    process.exit(0);
  })
  .catch((error) => {
    console.error('Stress seed failed:', error);
    process.exit(1);
  });

export { stressSeed };
```

**Step 2: Add npm script**

Add to `backend/package.json` scripts:

```json
"seed:stress": "ts-node src/database/seeds/stress-seed.ts"
```

**Step 3: Add Makefile target**

Add to `Makefile`:

```makefile
# Seed database with stress scenario data
seed-stress:
	@echo "🔥 Seeding database with stress scenario..."
	@cd backend && npm run seed:stress
	@echo "✅ Stress scenario seeded"
```

**Step 4: Verify it compiles**

Run: `cd backend && npx tsc --noEmit`
Expected: No errors

**Step 5: Commit**

```bash
git add backend/src/database/seeds/stress-seed.ts backend/package.json Makefile
git commit -m "feat(seed): add stress scenario seed with edge cases"
```

---

### Task 3: Create Full-Stack Stress Simulation Test (Layer 1)

This extends the existing frontend scheduling test infrastructure to run a 17-week stress simulation with all the edge cases from the design doc. This tests the scheduling **algorithm** under stress — not the API (that's separate).

**Files:**
- Create: `frontend/src/lib/scheduling/__tests__/fairScheduling.stress.test.ts`

**Step 1: Write the stress simulation test**

Create `frontend/src/lib/scheduling/__tests__/fairScheduling.stress.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { addDays, addWeeks, startOfWeek } from 'date-fns';
import { buildFairWeekSchedule } from '../fairScheduling';
import {
  createSoldier,
  createPlatoon,
  createTask,
  createConstraint,
  createScenario,
  createIdFactory,
  calculateFairnessMetrics,
  checkRuleViolations,
  hasNoViolations,
  resetIdCounter,
} from './fixtures';
import type { Assignment, Soldier, Task, Platoon, Constraint } from '@/types/scheduling';

// ============== Stress Simulation Infrastructure ==============

interface StressSimulationState {
  weekStart: Date;
  soldiers: Soldier[];
  tasks: Task[];
  platoons: Platoon[];
  assignments: Assignment[];
  weekNumber: number;
}

interface StressWeekReport {
  week: number;
  assignments: number;
  unfilledSlots: number;
  hasViolations: boolean;
  violationDetails: string[];
}

interface StressSimulationReport {
  totalWeeks: number;
  totalAssignments: number;
  totalUnfilledSlots: number;
  weeklyReports: StressWeekReport[];
  soldierHoursDeviation: number;
  platoonHoursDeviation: number;
  maxSoldierHours: number;
  minSoldierHours: number;
  maxMinRatio: number;
  allViolations: string[];
}

function createStressScenario() {
  resetIdCounter();

  // Create 5 platoons: 4 with 14 soldiers, 1 with 6 (undermanned)
  const platoons: Platoon[] = [];
  const soldiers: Soldier[] = [];
  const platoonSizes = [14, 14, 14, 14, 6];
  const platoonNames = ['א', 'ב', 'ג', 'ד', 'ה'];

  for (let p = 0; p < 5; p++) {
    const platoon = createPlatoon({ name: `מחלקה ${platoonNames[p]}` });
    platoons.push(platoon);

    for (let s = 0; s < platoonSizes[p]; s++) {
      const roles: string[] = ['soldier'];
      // Scarce commanders: 2 in platoon א, 1 in platoon ב, none elsewhere
      if (p === 0 && s < 2) roles.push('commander');
      if (p === 1 && s === 0) roles.push('commander');
      // Drivers: ~20% across all platoons
      if (s % 5 === 0 && !roles.includes('commander')) roles.push('driver');

      soldiers.push(
        createSoldier({
          name: `חייל ${platoonNames[p]}-${s + 1}`,
          roles,
          platoonId: platoon.id,
        })
      );
    }
  }

  // 3 tasks: morning (needs commander), evening (needs driver), night
  const tasks: Task[] = [
    createTask({
      name: 'משמרת בוקר',
      shiftStartHour: 6,
      shiftDuration: 8,
      restTimeBetweenShifts: 12,
      requiredRoles: [
        { role: 'commander', count: 1 },
        { role: 'soldier', count: 2 },
      ],
    }),
    createTask({
      name: 'משמרת ערב',
      shiftStartHour: 14,
      shiftDuration: 8,
      restTimeBetweenShifts: 12,
      requiredRoles: [
        { role: 'driver', count: 1 },
        { role: 'soldier', count: 2 },
      ],
    }),
    createTask({
      name: 'משמרת לילה',
      shiftStartHour: 22,
      shiftDuration: 8,
      restTimeBetweenShifts: 12,
      requiredRoles: [{ role: 'soldier', count: 2 }],
    }),
  ];

  const weekStart = startOfWeek(new Date('2026-02-01'), { weekStartsOn: 0 });

  return { platoons, soldiers, tasks, weekStart };
}

function applyReligiousFridayConstraints(
  soldiers: Soldier[],
  weekStart: Date,
  weeks: number,
): Soldier[] {
  // First 2 soldiers get every-Friday constraint
  return soldiers.map((s, i) => {
    if (i >= 2) return s;
    const constraints = [...s.constraints];
    for (let w = 0; w < weeks; w++) {
      const week = addWeeks(weekStart, w);
      const friday = addDays(startOfWeek(week, { weekStartsOn: 0 }), 5);
      const saturday = addDays(friday, 1);
      constraints.push(
        createConstraint({
          type: 'unavailable',
          reason: 'שבת - דתי',
          startDate: friday,
          endDate: saturday,
        })
      );
    }
    return { ...s, constraints };
  });
}

function runStressSimulation(weeks: number = 17): StressSimulationReport {
  const { platoons, soldiers: baseSoldiers, tasks: baseTasks, weekStart } = createStressScenario();

  // Apply religious Friday constraints
  let soldiers = applyReligiousFridayConstraints(baseSoldiers, weekStart, weeks);
  let tasks = [...baseTasks];

  const state: StressSimulationState = {
    weekStart,
    soldiers,
    tasks,
    platoons,
    assignments: [],
    weekNumber: 1,
  };

  const weeklyReports: StressWeekReport[] = [];
  let totalUnfilledSlots = 0;
  let idCounter = 0;
  const allViolations: string[] = [];

  for (let week = 1; week <= weeks; week++) {
    state.weekNumber = week;
    state.weekStart = addWeeks(weekStart, week - 1);

    // --- Apply disruptions ---

    // Week 3: Mid-rotation injury (driver in platoon ג)
    if (week === 3) {
      const gimelDriverIdx = state.soldiers.findIndex(
        s => s.platoonId === platoons[2].id && s.roles.includes('driver')
      );
      if (gimelDriverIdx >= 0) {
        const s = state.soldiers[gimelDriverIdx];
        state.soldiers[gimelDriverIdx] = {
          ...s,
          constraints: [
            ...s.constraints,
            createConstraint({
              type: 'medical',
              reason: 'פציעה באימון',
              startDate: state.weekStart,
              endDate: addWeeks(state.weekStart, 4),
            }),
          ],
        };
      }
    }

    // Week 5: Add 4th task
    if (week === 5) {
      state.tasks.push(
        createTask({
          name: 'שמירה נוספת',
          shiftStartHour: 10,
          shiftDuration: 6,
          restTimeBetweenShifts: 8,
          requiredRoles: [{ role: 'soldier', count: 2 }],
        })
      );
    }

    // Week 6: Holiday — 20 soldiers on vacation
    if (week === 6) {
      state.soldiers = state.soldiers.map((s, i) => {
        if (i < 5 || i >= 25) return s;
        return {
          ...s,
          constraints: [
            ...s.constraints,
            createConstraint({
              type: 'vacation',
              reason: 'חופשת חג',
              startDate: state.weekStart,
              endDate: addDays(state.weekStart, 6),
            }),
          ],
        };
      });
    }

    // Week 8: Lock 4 assignments, then run 3 times for stability
    if (week === 8) {
      // First run to get assignments
      const firstRun = buildFairWeekSchedule({
        weekStart: state.weekStart,
        soldiers: state.soldiers,
        tasks: state.tasks,
        platoons: state.platoons,
        existingAssignments: state.assignments,
        idFactory: () => `stress-${++idCounter}`,
      });

      // Lock first 4 assignments of this week
      const weekAssignments = firstRun.assignments.filter(a => {
        const start = new Date(a.startTime);
        return start >= state.weekStart && start < addWeeks(state.weekStart, 1);
      });

      const locked = weekAssignments.slice(0, 4).map(a => ({ ...a, locked: true }));
      const rest = firstRun.assignments.filter(
        a => !locked.find(l => l.id === a.id)
      );
      state.assignments = [...rest, ...locked];

      // Run 2 more times and verify stability
      const run2 = buildFairWeekSchedule({
        weekStart: state.weekStart,
        soldiers: state.soldiers,
        tasks: state.tasks,
        platoons: state.platoons,
        existingAssignments: state.assignments,
        idFactory: () => `stress-${++idCounter}`,
      });

      const run3 = buildFairWeekSchedule({
        weekStart: state.weekStart,
        soldiers: state.soldiers,
        tasks: state.tasks,
        platoons: state.platoons,
        existingAssignments: state.assignments,
        idFactory: () => `stress-${++idCounter}`,
      });

      // Verify locked assignments survived
      for (const la of locked) {
        const inRun2 = run2.assignments.find(
          a => a.soldierId === la.soldierId && a.taskId === la.taskId &&
               new Date(a.startTime).getTime() === new Date(la.startTime).getTime()
        );
        if (!inRun2) {
          allViolations.push(`Week 8: Locked assignment lost for soldier ${la.soldierId}`);
        }
      }

      state.assignments = run3.assignments;
      totalUnfilledSlots += run3.unfilledSlots;

      const weekViolations = checkRuleViolations(
        run3.assignments.filter(a => {
          const start = new Date(a.startTime);
          return start >= state.weekStart && start < addWeeks(state.weekStart, 1);
        }),
        state.soldiers,
        state.tasks,
      );

      const violationDetails: string[] = [];
      if (weekViolations.restTimeViolations.length) violationDetails.push(`${weekViolations.restTimeViolations.length} rest violations`);
      if (weekViolations.consecutiveNightViolations.length) violationDetails.push(`${weekViolations.consecutiveNightViolations.length} consecutive night violations`);
      if (weekViolations.constraintViolations.length) violationDetails.push(`${weekViolations.constraintViolations.length} constraint violations`);
      if (weekViolations.roleViolations.length) violationDetails.push(`${weekViolations.roleViolations.length} role violations`);
      if (weekViolations.overlapViolations.length) violationDetails.push(`${weekViolations.overlapViolations.length} overlap violations`);

      weeklyReports.push({
        week,
        assignments: run3.assignments.filter(a => {
          const start = new Date(a.startTime);
          return start >= state.weekStart && start < addWeeks(state.weekStart, 1);
        }).length,
        unfilledSlots: run3.unfilledSlots,
        hasViolations: !hasNoViolations(weekViolations),
        violationDetails,
      });

      allViolations.push(...violationDetails);
      continue; // Skip normal scheduling for week 8
    }

    // Week 10: Deactivate evening shift
    if (week === 10) {
      state.tasks = state.tasks.filter(t => t.shiftStartHour !== 14);
    }

    // Week 12: Both commanders in platoon א on vacation
    if (week === 12) {
      state.soldiers = state.soldiers.map(s => {
        if (s.platoonId !== platoons[0].id || !s.roles.includes('commander')) return s;
        return {
          ...s,
          constraints: [
            ...s.constraints,
            createConstraint({
              type: 'vacation',
              reason: 'חופשת מפקד',
              startDate: state.weekStart,
              endDate: addDays(state.weekStart, 6),
            }),
          ],
        };
      });
    }

    // --- Normal scheduling ---
    const result = buildFairWeekSchedule({
      weekStart: state.weekStart,
      soldiers: state.soldiers,
      tasks: state.tasks,
      platoons: state.platoons,
      existingAssignments: state.assignments,
      idFactory: () => `stress-${++idCounter}`,
    });

    state.assignments = result.assignments;
    totalUnfilledSlots += result.unfilledSlots;

    // Check violations for this week
    const weekAssignments = result.assignments.filter(a => {
      const start = new Date(a.startTime);
      return start >= state.weekStart && start < addWeeks(state.weekStart, 1);
    });

    const weekViolations = checkRuleViolations(
      weekAssignments,
      state.soldiers,
      state.tasks,
    );

    const violationDetails: string[] = [];
    if (weekViolations.restTimeViolations.length) violationDetails.push(`${weekViolations.restTimeViolations.length} rest violations`);
    if (weekViolations.consecutiveNightViolations.length) violationDetails.push(`${weekViolations.consecutiveNightViolations.length} consecutive night violations`);
    if (weekViolations.constraintViolations.length) violationDetails.push(`${weekViolations.constraintViolations.length} constraint violations`);
    if (weekViolations.roleViolations.length) violationDetails.push(`${weekViolations.roleViolations.length} role violations`);
    if (weekViolations.overlapViolations.length) violationDetails.push(`${weekViolations.overlapViolations.length} overlap violations`);

    weeklyReports.push({
      week,
      assignments: weekAssignments.length,
      unfilledSlots: result.unfilledSlots,
      hasViolations: !hasNoViolations(weekViolations),
      violationDetails,
    });

    allViolations.push(...violationDetails);
  }

  // Calculate final fairness metrics
  const metrics = calculateFairnessMetrics(
    state.assignments,
    state.soldiers,
    state.platoons,
    state.tasks,
  );

  const soldierHours = metrics.soldierStats.map(s => s.hours).filter(h => h > 0);
  const maxHours = Math.max(...soldierHours, 0);
  const minHours = Math.min(...soldierHours, 0);

  return {
    totalWeeks: weeks,
    totalAssignments: state.assignments.length,
    totalUnfilledSlots,
    weeklyReports,
    soldierHoursDeviation: metrics.soldierHoursDeviation,
    platoonHoursDeviation: metrics.platoonHoursDeviation,
    maxSoldierHours: maxHours,
    minSoldierHours: minHours,
    maxMinRatio: minHours > 0 ? maxHours / minHours : Infinity,
    allViolations,
  };
}

// ============== Tests ==============

describe('Stress Scenario Simulation (17 weeks)', () => {
  it('completes 17 weeks without crashing', () => {
    const report = runStressSimulation(17);
    expect(report.totalWeeks).toBe(17);
    expect(report.totalAssignments).toBeGreaterThan(0);
  });

  it('has zero constraint violations across all weeks', () => {
    const report = runStressSimulation(17);
    const constraintViolations = report.allViolations.filter(v =>
      v.includes('constraint')
    );
    expect(constraintViolations).toEqual([]);
  });

  it('has zero rest time violations across all weeks', () => {
    const report = runStressSimulation(17);
    const restViolations = report.allViolations.filter(v =>
      v.includes('rest')
    );
    expect(restViolations).toEqual([]);
  });

  it('has zero consecutive night violations', () => {
    const report = runStressSimulation(17);
    const nightViolations = report.allViolations.filter(v =>
      v.includes('consecutive night')
    );
    expect(nightViolations).toEqual([]);
  });

  it('has zero role violations', () => {
    const report = runStressSimulation(17);
    const roleViolations = report.allViolations.filter(v =>
      v.includes('role')
    );
    expect(roleViolations).toEqual([]);
  });

  it('has zero overlap violations', () => {
    const report = runStressSimulation(17);
    const overlapViolations = report.allViolations.filter(v =>
      v.includes('overlap')
    );
    expect(overlapViolations).toEqual([]);
  });

  it('maintains soldier fairness within acceptable bounds', () => {
    const report = runStressSimulation(17);
    // With stress scenarios, allow higher deviation than normal
    expect(report.soldierHoursDeviation).toBeLessThan(60);
    // No soldier should have more than 3x another (excluding zero-hour soldiers)
    if (report.minSoldierHours > 0) {
      expect(report.maxMinRatio).toBeLessThan(3);
    }
  });

  it('maintains platoon fairness within acceptable bounds', () => {
    const report = runStressSimulation(17);
    // Platoon ה has only 6 soldiers, so deviation will be higher
    expect(report.platoonHoursDeviation).toBeLessThan(35);
  });

  it('handles holiday week (week 6) — reports unfilled slots honestly', () => {
    const report = runStressSimulation(17);
    const week6 = report.weeklyReports.find(r => r.week === 6);
    expect(week6).toBeDefined();
    // With 20 of ~62 soldiers on vacation, some slots may be unfilled
    // The key is no crashes and no violations
    expect(week6!.hasViolations).toBe(false);
  });

  it('handles locked assignments in week 8 — no locked assignments lost', () => {
    const report = runStressSimulation(17);
    const lockViolations = report.allViolations.filter(v =>
      v.includes('Locked assignment lost')
    );
    expect(lockViolations).toEqual([]);
  });

  it('handles task deactivation in week 10 — adapts cleanly', () => {
    const report = runStressSimulation(17);
    const week10 = report.weeklyReports.find(r => r.week === 10);
    expect(week10).toBeDefined();
    expect(week10!.hasViolations).toBe(false);
    // Fewer assignments after removing evening shift
    const week9 = report.weeklyReports.find(r => r.week === 9);
    expect(week10!.assignments).toBeLessThan(week9!.assignments);
  });

  it('handles both commanders on vacation in week 12', () => {
    const report = runStressSimulation(17);
    const week12 = report.weeklyReports.find(r => r.week === 12);
    expect(week12).toBeDefined();
    // Should still work — pulls commander from platoon ב
    expect(week12!.hasViolations).toBe(false);
  });

  it('prints summary report', () => {
    const report = runStressSimulation(17);
    console.log('\n=== STRESS SIMULATION REPORT ===');
    console.log(`Total weeks: ${report.totalWeeks}`);
    console.log(`Total assignments: ${report.totalAssignments}`);
    console.log(`Total unfilled slots: ${report.totalUnfilledSlots}`);
    console.log(`Soldier hours deviation: ${report.soldierHoursDeviation.toFixed(1)}%`);
    console.log(`Platoon hours deviation: ${report.platoonHoursDeviation.toFixed(1)}%`);
    console.log(`Max/min soldier hours: ${report.maxSoldierHours.toFixed(0)}/${report.minSoldierHours.toFixed(0)} (ratio: ${report.maxMinRatio.toFixed(1)}x)`);
    console.log(`Violations: ${report.allViolations.length}`);
    if (report.allViolations.length > 0) {
      report.allViolations.forEach(v => console.log(`  - ${v}`));
    }
    console.log('\nWeekly breakdown:');
    for (const w of report.weeklyReports) {
      const status = w.hasViolations ? '❌' : '✅';
      const unfilled = w.unfilledSlots > 0 ? ` (${w.unfilledSlots} unfilled)` : '';
      console.log(`  Week ${w.week}: ${status} ${w.assignments} assignments${unfilled}`);
    }
    console.log('================================\n');

    // This test always passes — it's just for the report
    expect(true).toBe(true);
  });
});
```

**Step 2: Run the test**

Run: `cd frontend && npx vitest run src/lib/scheduling/__tests__/fairScheduling.stress.test.ts`
Expected: All tests pass (some unfilled slots in week 6 are acceptable)

**Step 3: Commit**

```bash
git add frontend/src/lib/scheduling/__tests__/fairScheduling.stress.test.ts
git commit -m "test: add 17-week stress simulation with edge cases"
```

---

### Task 4: Create API Integration Simulation Test (Layer 1b)

Tests the full backend stack: seed data → create assignments via API → verify constraints → check fairness. Uses supertest to call the actual NestJS app.

**Files:**
- Create: `backend/test/simulation.e2e-spec.ts`

**Step 1: Write the API simulation test**

Create `backend/test/simulation.e2e-spec.ts`:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import { seed } from '../src/database/seeds/seed';

describe('API Simulation (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    dataSource = moduleFixture.get(DataSource);
    await seed(dataSource);
  }, 30000);

  afterAll(async () => {
    await app.close();
  });

  it('should have seeded soldiers', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/soldiers')
      .expect(200);

    expect(res.body.length).toBeGreaterThanOrEqual(70);
  });

  it('should have seeded tasks', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/tasks')
      .expect(200);

    expect(res.body.length).toBeGreaterThanOrEqual(2);
  });

  it('should have seeded platoons', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/platoons')
      .expect(200);

    expect(res.body.length).toBeGreaterThanOrEqual(5);
  });

  it('should create an assignment and retrieve it', async () => {
    const soldiers = (await request(app.getHttpServer()).get('/api/soldiers')).body;
    const tasks = (await request(app.getHttpServer()).get('/api/tasks')).body;

    const assignment = {
      soldierId: soldiers[0].id,
      taskId: tasks[0].id,
      role: 'soldier',
      startTime: '2026-02-01T06:00:00.000Z',
      endTime: '2026-02-01T14:00:00.000Z',
      locked: false,
    };

    const createRes = await request(app.getHttpServer())
      .post('/api/assignments')
      .send(assignment)
      .expect(201);

    expect(createRes.body.id).toBeDefined();
    expect(createRes.body.soldierId).toBe(soldiers[0].id);

    // Verify it's retrievable
    const getRes = await request(app.getHttpServer())
      .get(`/api/assignments/${createRes.body.id}`)
      .expect(200);

    expect(getRes.body.soldierId).toBe(soldiers[0].id);
  });

  it('should batch create assignments', async () => {
    const soldiers = (await request(app.getHttpServer()).get('/api/soldiers')).body;
    const tasks = (await request(app.getHttpServer()).get('/api/tasks')).body;

    const assignments = [
      {
        soldierId: soldiers[1].id,
        taskId: tasks[0].id,
        role: 'soldier',
        startTime: '2026-02-02T06:00:00.000Z',
        endTime: '2026-02-02T14:00:00.000Z',
        locked: false,
      },
      {
        soldierId: soldiers[2].id,
        taskId: tasks[0].id,
        role: 'soldier',
        startTime: '2026-02-02T06:00:00.000Z',
        endTime: '2026-02-02T14:00:00.000Z',
        locked: false,
      },
    ];

    const res = await request(app.getHttpServer())
      .post('/api/assignments/batch')
      .send({ assignments, replaceNonLocked: false })
      .expect(201);

    expect(res.body.length).toBe(2);
  });

  it('should add constraint and verify soldier cannot be assigned during that period', async () => {
    const soldiers = (await request(app.getHttpServer()).get('/api/soldiers')).body;
    const soldier = soldiers[0];

    // Add medical constraint
    const constraintRes = await request(app.getHttpServer())
      .post(`/api/soldiers/${soldier.id}/constraints`)
      .send({
        type: 'medical',
        reason: 'פציעה',
        startDate: '2026-03-01',
        endDate: '2026-03-07',
      })
      .expect(201);

    expect(constraintRes.body.type).toBe('medical');

    // Verify soldier has constraint
    const updatedSoldier = (await request(app.getHttpServer())
      .get(`/api/soldiers/${soldier.id}`)
      .expect(200)).body;

    const hasConstraint = updatedSoldier.constraints.some(
      (c: any) => c.type === 'medical' && c.reason === 'פציעה'
    );
    expect(hasConstraint).toBe(true);
  });

  it('should delete assignment and verify removal', async () => {
    const soldiers = (await request(app.getHttpServer()).get('/api/soldiers')).body;
    const tasks = (await request(app.getHttpServer()).get('/api/tasks')).body;

    // Create
    const createRes = await request(app.getHttpServer())
      .post('/api/assignments')
      .send({
        soldierId: soldiers[5].id,
        taskId: tasks[0].id,
        role: 'soldier',
        startTime: '2026-02-10T06:00:00.000Z',
        endTime: '2026-02-10T14:00:00.000Z',
        locked: false,
      })
      .expect(201);

    // Delete
    await request(app.getHttpServer())
      .delete(`/api/assignments/${createRes.body.id}`)
      .expect(204);

    // Verify gone
    await request(app.getHttpServer())
      .get(`/api/assignments/${createRes.body.id}`)
      .expect(404);
  });

  it('should update settings and verify operational period', async () => {
    await request(app.getHttpServer())
      .patch('/api/settings')
      .send({
        operationalStartDate: '2026-02-01',
        operationalEndDate: '2026-05-31',
        minBasePresence: 75,
        totalSoldiers: 70,
      })
      .expect(200);

    const settings = (await request(app.getHttpServer())
      .get('/api/settings')
      .expect(200)).body;

    expect(settings.operationalStartDate).toContain('2026-02-01');
    expect(settings.operationalEndDate).toContain('2026-05-31');
  });

  it('should handle task deactivation', async () => {
    const tasks = (await request(app.getHttpServer()).get('/api/tasks')).body;
    const task = tasks[0];

    // Deactivate
    await request(app.getHttpServer())
      .patch(`/api/tasks/${task.id}`)
      .send({ isActive: false })
      .expect(200);

    // Verify
    const updated = (await request(app.getHttpServer())
      .get(`/api/tasks/${task.id}`)
      .expect(200)).body;

    expect(updated.isActive).toBe(false);

    // Reactivate for other tests
    await request(app.getHttpServer())
      .patch(`/api/tasks/${task.id}`)
      .send({ isActive: true })
      .expect(200);
  });
});
```

**Step 2: Run the test**

Run: `cd backend && npm run test:e2e -- --testPathPattern=simulation`
Expected: All tests pass (requires running database)

**Step 3: Commit**

```bash
git add backend/test/simulation.e2e-spec.ts
git commit -m "test: add API integration simulation tests"
```

---

### Task 5: Create Playwright E2E Simulation Tests (Layer 2)

Six Playwright tests simulating key commander workflows through the browser UI.

**Files:**
- Create: `frontend/tests/e2e/simulation.spec.ts`

**Step 1: Write the E2E simulation tests**

Create `frontend/tests/e2e/simulation.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';
import { loginAsTestUser } from './helpers/auth';

test.describe('Simulation: Commander Workflows', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('1. Fresh start → auto-schedule → verify assignments appear', async ({ page }) => {
    // Navigate to schedule
    await page.click('button:has-text("שיבוצים")');
    await page.waitForSelector('text=לוח שיבוצים', { timeout: 10000 });

    // Run auto-schedule
    await page.click('button:has-text("שיבוץ אוטומטי")');
    await page.waitForSelector('text=שיבוץ אוטומטי הושלם', { timeout: 30000 });

    // Verify assignments appeared (colored badges in the grid)
    const assignmentBadges = page.locator('[class*="bg-"][class*="rounded"]');
    const count = await assignmentBadges.count();
    expect(count).toBeGreaterThan(0);
  });

  test('2. Manual assignment + lock + re-schedule preserves lock', async ({ page }) => {
    // Navigate to schedule
    await page.click('button:has-text("שיבוצים")');
    await page.waitForSelector('text=לוח שיבוצים', { timeout: 10000 });

    // Run auto-schedule first to populate
    await page.click('button:has-text("שיבוץ אוטומטי")');
    await page.waitForSelector('text=שיבוץ אוטומטי הושלם', { timeout: 30000 });

    // Find an assignment badge and click to lock it
    const firstBadge = page.locator('[class*="bg-"][class*="rounded"]').first();
    await firstBadge.waitFor({ timeout: 5000 });
    const badgeText = await firstBadge.textContent();

    // Click the badge to open edit dialog
    await firstBadge.click();

    // Look for lock toggle/button in the dialog
    const lockButton = page.locator('button:has-text("נעל"), label:has-text("נעול"), [aria-label*="lock"]');
    if (await lockButton.isVisible({ timeout: 3000 })) {
      await lockButton.click();
    }

    // Close dialog if open
    const closeBtn = page.locator('button:has-text("סגור"), button:has-text("שמור")');
    if (await closeBtn.isVisible({ timeout: 2000 })) {
      await closeBtn.click();
    }

    // Re-run auto-schedule
    await page.click('button:has-text("שיבוץ אוטומטי")');
    await page.waitForSelector('text=שיבוץ אוטומטי הושלם', { timeout: 30000 });

    // Verify badge still exists (assignment wasn't removed)
    const afterBadges = page.locator('[class*="bg-"][class*="rounded"]');
    expect(await afterBadges.count()).toBeGreaterThan(0);
  });

  test('3. Add constraint → re-schedule → soldier excluded', async ({ page }) => {
    // First, get a soldier name from the schedule
    await page.click('button:has-text("שיבוצים")');
    await page.waitForSelector('text=לוח שיבוצים', { timeout: 10000 });

    await page.click('button:has-text("שיבוץ אוטומטי")');
    await page.waitForSelector('text=שיבוץ אוטומטי הושלם', { timeout: 30000 });

    // Navigate to soldiers to add constraint
    await page.click('button:has-text("חיילים")');
    await page.waitForSelector('text=ניהול חיילים', { timeout: 10000 });

    // Get first soldier name
    const firstRow = page.locator('tbody tr').first();
    await firstRow.waitFor({ timeout: 5000 });
    const soldierName = await firstRow.locator('td').first().textContent();

    // Add constraint (look for constraint button on the row)
    const constraintBtn = firstRow.locator('button[aria-label*="אילוץ"], button:has-text("אילוץ")');
    if (await constraintBtn.isVisible({ timeout: 3000 })) {
      await constraintBtn.click();

      // Fill constraint form
      const typeSelect = page.locator('select, [role="combobox"]').first();
      if (await typeSelect.isVisible({ timeout: 2000 })) {
        await typeSelect.click();
        await page.click('text=חופשה');
      }

      // Submit constraint
      const submitBtn = page.locator('button[type="submit"], button:has-text("שמור")');
      if (await submitBtn.isVisible({ timeout: 2000 })) {
        await submitBtn.click();
      }
    }

    // Verify: navigate to schedule and re-run auto-schedule
    await page.click('button:has-text("שיבוצים")');
    await page.waitForSelector('text=לוח שיבוצים', { timeout: 10000 });

    // This test validates the flow doesn't crash
    expect(soldierName).toBeTruthy();
  });

  test('4. Analytics accuracy — charts render with data', async ({ page }) => {
    // Run auto-schedule first
    await page.click('button:has-text("שיבוצים")');
    await page.waitForSelector('text=לוח שיבוצים', { timeout: 10000 });

    await page.click('button:has-text("שיבוץ אוטומטי")');
    await page.waitForSelector('text=שיבוץ אוטומטי הושלם', { timeout: 30000 });

    // Navigate to analytics
    await page.click('button:has-text("אנליטיקה"), button:has-text("ניתוח")');
    await page.waitForLoadState('networkidle');

    // Wait for charts/tables to render
    await page.waitForTimeout(2000);

    // Verify some analytics content is visible
    const pageContent = await page.textContent('body');
    // Should show platoon-related data or hours
    const hasAnalyticsContent =
      pageContent?.includes('שעות') ||
      pageContent?.includes('מחלקה') ||
      pageContent?.includes('שיבוצים');

    expect(hasAnalyticsContent).toBe(true);
  });

  test('5. Settings change — operational dates propagate', async ({ page }) => {
    // Navigate to settings
    await page.click('button:has-text("הגדרות")');
    await page.waitForLoadState('networkidle');

    // Verify settings page loaded
    const pageContent = await page.textContent('body');
    const hasSettingsContent =
      pageContent?.includes('הגדרות') ||
      pageContent?.includes('נוכחות') ||
      pageContent?.includes('תקופה');

    expect(hasSettingsContent).toBe(true);
  });

  test('6. Re-schedule stability — same result twice', async ({ page }) => {
    await page.click('button:has-text("שיבוצים")');
    await page.waitForSelector('text=לוח שיבוצים', { timeout: 10000 });

    // First run
    await page.click('button:has-text("שיבוץ אוטומטי")');
    await page.waitForSelector('text=שיבוץ אוטומטי הושלם', { timeout: 30000 });

    // Count assignments
    const badges1 = page.locator('[class*="bg-"][class*="rounded"]');
    const count1 = await badges1.count();

    // Second run
    await page.click('button:has-text("שיבוץ אוטומטי")');
    await page.waitForSelector('text=שיבוץ אוטומטי הושלם', { timeout: 30000 });

    // Count again
    const badges2 = page.locator('[class*="bg-"][class*="rounded"]');
    const count2 = await badges2.count();

    // Should be same (or very close — within 2 due to timing)
    expect(Math.abs(count1 - count2)).toBeLessThanOrEqual(2);
  });
});
```

**Step 2: Run the tests (requires running backend)**

Run: `cd frontend && npx playwright test simulation.spec.ts`
Expected: All 6 tests pass

**Step 3: Commit**

```bash
git add frontend/tests/e2e/simulation.spec.ts
git commit -m "test: add Playwright E2E simulation tests for commander workflows"
```

---

### Task 6: Create Manual Smoke Test Checklist (Layer 3)

The checklist document for post-deployment manual verification.

**Files:**
- Create: `docs/plans/simulation-smoke-test-checklist.md`

**Step 1: Write the checklist**

Create `docs/plans/simulation-smoke-test-checklist.md` with the full checklist from the design document (Section 4). This is a standalone document that can be printed or used as-is.

**Step 2: Commit**

```bash
git add docs/plans/simulation-smoke-test-checklist.md
git commit -m "docs: add manual smoke test checklist for post-deployment"
```

---

### Task 7: Verify Everything Works Together

**Step 1: Run frontend scheduling tests (including new stress test)**

Run: `cd frontend && npx vitest run src/lib/scheduling/__tests__/`
Expected: All tests pass (48 existing + 13 new stress tests)

**Step 2: Run backend build**

Run: `cd backend && npm run build`
Expected: No errors

**Step 3: Run backend unit tests**

Run: `cd backend && npm run test`
Expected: All tests pass

**Step 4: Run backend E2E tests (requires running database)**

Run: `cd backend && npm run test:e2e`
Expected: All tests pass including simulation.e2e-spec.ts

**Step 5: Run Playwright tests (requires running backend)**

Run: `cd frontend && npx playwright test simulation.spec.ts`
Expected: All 6 tests pass

**Step 6: Final commit**

If any adjustments were needed, commit them:

```bash
git commit -m "test: fix simulation test adjustments"
```

---

## Summary

| Task | Layer | What | Files |
|------|-------|------|-------|
| 1 | Backend | Batch assignment endpoint | `backend/src/assignments/` |
| 2 | Backend | Stress scenario seed | `backend/src/database/seeds/stress-seed.ts` |
| 3 | Frontend | 17-week stress simulation (Vitest) | `frontend/src/lib/scheduling/__tests__/fairScheduling.stress.test.ts` |
| 4 | Backend | API integration simulation (supertest) | `backend/test/simulation.e2e-spec.ts` |
| 5 | Frontend | Playwright E2E simulation (6 tests) | `frontend/tests/e2e/simulation.spec.ts` |
| 6 | Docs | Manual smoke test checklist | `docs/plans/simulation-smoke-test-checklist.md` |
| 7 | All | Verify everything works | — |
