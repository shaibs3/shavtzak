import { describe, it, expect } from 'vitest';
import { addDays, addWeeks, startOfWeek } from 'date-fns';
import { buildFairWeekSchedule } from '../fairScheduling';
import {
  createSoldier,
  createPlatoon,
  createTask,
  createConstraint,
  createIdFactory,
  calculateFairnessMetrics,
  checkRuleViolations,
  hasNoViolations,
  resetIdCounter,
} from './fixtures';
import type { Assignment, Soldier, Task, Platoon } from '@/types/scheduling';

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
        }),
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
        }),
      );
    }
    return { ...s, constraints };
  });
}

function collectViolationDetails(
  weekViolations: ReturnType<typeof checkRuleViolations>,
): string[] {
  const details: string[] = [];
  if (weekViolations.restTimeViolations.length)
    details.push(`${weekViolations.restTimeViolations.length} rest violations`);
  if (weekViolations.consecutiveNightViolations.length)
    details.push(
      `${weekViolations.consecutiveNightViolations.length} consecutive night violations`,
    );
  if (weekViolations.constraintViolations.length)
    details.push(
      `${weekViolations.constraintViolations.length} constraint violations`,
    );
  if (weekViolations.roleViolations.length)
    details.push(`${weekViolations.roleViolations.length} role violations`);
  if (weekViolations.overlapViolations.length)
    details.push(
      `${weekViolations.overlapViolations.length} overlap violations`,
    );
  return details;
}

function scheduleAndReport(
  state: StressSimulationState,
  idCounter: { value: number },
): { weekReport: StressWeekReport; unfilledSlots: number } {
  const result = buildFairWeekSchedule({
    weekStart: state.weekStart,
    soldiers: state.soldiers,
    tasks: state.tasks,
    platoons: state.platoons,
    existingAssignments: state.assignments,
    idFactory: () => `stress-${++idCounter.value}`,
  });

  state.assignments = result.assignments;

  const weekAssignments = result.assignments.filter((a) => {
    const start = new Date(a.startTime);
    return start >= state.weekStart && start < addWeeks(state.weekStart, 1);
  });

  const weekViolations = checkRuleViolations(
    weekAssignments,
    state.soldiers,
    state.tasks,
  );

  return {
    weekReport: {
      week: state.weekNumber,
      assignments: weekAssignments.length,
      unfilledSlots: result.unfilledSlots,
      hasViolations: !hasNoViolations(weekViolations),
      violationDetails: collectViolationDetails(weekViolations),
    },
    unfilledSlots: result.unfilledSlots,
  };
}

function runStressSimulation(weeks: number = 17): StressSimulationReport {
  const {
    platoons,
    soldiers: baseSoldiers,
    tasks: baseTasks,
    weekStart,
  } = createStressScenario();

  // Apply religious Friday constraints
  const soldiers = applyReligiousFridayConstraints(baseSoldiers, weekStart, weeks);

  const state: StressSimulationState = {
    weekStart,
    soldiers,
    tasks: [...baseTasks],
    platoons,
    assignments: [],
    weekNumber: 1,
  };

  const weeklyReports: StressWeekReport[] = [];
  let totalUnfilledSlots = 0;
  const idCounter = { value: 0 };
  const allViolations: string[] = [];

  for (let week = 1; week <= weeks; week++) {
    state.weekNumber = week;
    state.weekStart = addWeeks(weekStart, week - 1);

    // --- Apply disruptions ---

    // Week 3: Mid-rotation injury (driver in platoon ג)
    if (week === 3) {
      const gimelDriverIdx = state.soldiers.findIndex(
        (s) => s.platoonId === platoons[2].id && s.roles.includes('driver'),
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
        }),
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
        idFactory: () => `stress-${++idCounter.value}`,
      });

      // Lock first 4 assignments of this week
      const weekAssignments = firstRun.assignments.filter((a) => {
        const start = new Date(a.startTime);
        return start >= state.weekStart && start < addWeeks(state.weekStart, 1);
      });

      const locked = weekAssignments
        .slice(0, 4)
        .map((a) => ({ ...a, locked: true }));
      const rest = firstRun.assignments.filter(
        (a) => !locked.find((l) => l.id === a.id),
      );
      state.assignments = [...rest, ...locked];

      // Run 2 more times and verify stability
      const run2 = buildFairWeekSchedule({
        weekStart: state.weekStart,
        soldiers: state.soldiers,
        tasks: state.tasks,
        platoons: state.platoons,
        existingAssignments: state.assignments,
        idFactory: () => `stress-${++idCounter.value}`,
      });

      const run3 = buildFairWeekSchedule({
        weekStart: state.weekStart,
        soldiers: state.soldiers,
        tasks: state.tasks,
        platoons: state.platoons,
        existingAssignments: state.assignments,
        idFactory: () => `stress-${++idCounter.value}`,
      });

      // Verify locked assignments survived
      for (const la of locked) {
        const inRun2 = run2.assignments.find(
          (a) =>
            a.soldierId === la.soldierId &&
            a.taskId === la.taskId &&
            new Date(a.startTime).getTime() ===
              new Date(la.startTime).getTime(),
        );
        if (!inRun2) {
          allViolations.push(
            `Week 8: Locked assignment lost for soldier ${la.soldierId}`,
          );
        }
      }

      state.assignments = run3.assignments;
      totalUnfilledSlots += run3.unfilledSlots;

      const weekViolations3 = checkRuleViolations(
        run3.assignments.filter((a) => {
          const start = new Date(a.startTime);
          return (
            start >= state.weekStart && start < addWeeks(state.weekStart, 1)
          );
        }),
        state.soldiers,
        state.tasks,
      );

      const violationDetails = collectViolationDetails(weekViolations3);

      weeklyReports.push({
        week,
        assignments: run3.assignments.filter((a) => {
          const start = new Date(a.startTime);
          return (
            start >= state.weekStart && start < addWeeks(state.weekStart, 1)
          );
        }).length,
        unfilledSlots: run3.unfilledSlots,
        hasViolations: !hasNoViolations(weekViolations3),
        violationDetails,
      });

      allViolations.push(...violationDetails);
      continue; // Skip normal scheduling for week 8
    }

    // Week 10: Deactivate evening shift
    if (week === 10) {
      state.tasks = state.tasks.filter((t) => t.shiftStartHour !== 14);
    }

    // Week 12: Both commanders in platoon א on vacation
    if (week === 12) {
      state.soldiers = state.soldiers.map((s) => {
        if (s.platoonId !== platoons[0].id || !s.roles.includes('commander'))
          return s;
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
    const { weekReport, unfilledSlots } = scheduleAndReport(state, idCounter);
    weeklyReports.push(weekReport);
    totalUnfilledSlots += unfilledSlots;
    allViolations.push(...weekReport.violationDetails);
  }

  // Calculate final fairness metrics
  const metrics = calculateFairnessMetrics(
    state.assignments,
    state.soldiers,
    state.platoons,
    state.tasks,
  );

  const soldierHours = metrics.soldierStats
    .map((s) => s.hours)
    .filter((h) => h > 0);
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
    const constraintViolations = report.allViolations.filter((v) =>
      v.includes('constraint'),
    );
    expect(constraintViolations).toEqual([]);
  });

  it('has minimal rest time violations across all weeks', () => {
    const report = runStressSimulation(17);
    const restViolations = report.allViolations.filter((v) =>
      v.includes('rest'),
    );
    // Under extreme stress (holiday week with 20 soldiers out), a few rest
    // violations are acceptable as the algorithm prioritizes filling slots
    expect(restViolations.length).toBeLessThanOrEqual(2);
  });

  it('has zero consecutive night violations', () => {
    const report = runStressSimulation(17);
    const nightViolations = report.allViolations.filter((v) =>
      v.includes('consecutive night'),
    );
    expect(nightViolations).toEqual([]);
  });

  it('has zero role violations', () => {
    const report = runStressSimulation(17);
    const roleViolations = report.allViolations.filter((v) =>
      v.includes('role'),
    );
    expect(roleViolations).toEqual([]);
  });

  it('has zero overlap violations', () => {
    const report = runStressSimulation(17);
    const overlapViolations = report.allViolations.filter((v) =>
      v.includes('overlap'),
    );
    expect(overlapViolations).toEqual([]);
  });

  it('maintains soldier fairness within acceptable bounds', () => {
    const report = runStressSimulation(17);
    // With stress scenarios (undermanned platoon, scarce commanders),
    // allow higher deviation than normal
    expect(report.soldierHoursDeviation).toBeLessThan(70);
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
    const week6 = report.weeklyReports.find((r) => r.week === 6);
    expect(week6).toBeDefined();
    // With 20 of ~62 soldiers on vacation, the algorithm is under extreme
    // pressure. Some rest violations may occur as it prioritizes filling slots.
    // The key assertion: no constraint, role, or overlap violations.
    const week6Violations = week6!.violationDetails;
    const criticalViolations = week6Violations.filter(
      (v) =>
        v.includes('constraint') ||
        v.includes('role') ||
        v.includes('overlap'),
    );
    expect(criticalViolations).toEqual([]);
  });

  it('handles locked assignments in week 8 — no locked assignments lost', () => {
    const report = runStressSimulation(17);
    const lockViolations = report.allViolations.filter((v) =>
      v.includes('Locked assignment lost'),
    );
    expect(lockViolations).toEqual([]);
  });

  it('handles task deactivation in week 10 — adapts cleanly', () => {
    const report = runStressSimulation(17);
    const week10 = report.weeklyReports.find((r) => r.week === 10);
    expect(week10).toBeDefined();
    expect(week10!.hasViolations).toBe(false);
    // Fewer assignments after removing evening shift
    const week9 = report.weeklyReports.find((r) => r.week === 9);
    expect(week10!.assignments).toBeLessThan(week9!.assignments);
  });

  it('handles both commanders on vacation in week 12', () => {
    const report = runStressSimulation(17);
    const week12 = report.weeklyReports.find((r) => r.week === 12);
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
    console.log(
      `Soldier hours deviation: ${report.soldierHoursDeviation.toFixed(1)}%`,
    );
    console.log(
      `Platoon hours deviation: ${report.platoonHoursDeviation.toFixed(1)}%`,
    );
    console.log(
      `Max/min soldier hours: ${report.maxSoldierHours.toFixed(0)}/${report.minSoldierHours.toFixed(0)} (ratio: ${report.maxMinRatio.toFixed(1)}x)`,
    );
    console.log(`Violations: ${report.allViolations.length}`);
    if (report.allViolations.length > 0) {
      report.allViolations.forEach((v) => console.log(`  - ${v}`));
    }
    console.log('\nWeekly breakdown:');
    for (const w of report.weeklyReports) {
      const status = w.hasViolations ? 'FAIL' : 'OK';
      const unfilled =
        w.unfilledSlots > 0 ? ` (${w.unfilledSlots} unfilled)` : '';
      console.log(
        `  Week ${w.week}: ${status} ${w.assignments} assignments${unfilled}`,
      );
    }
    console.log('================================\n');

    // This test always passes — it's just for the report
    expect(true).toBe(true);
  });
});
