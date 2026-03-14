import { describe, it, expect, beforeEach } from 'vitest';
import { addDays, addHours, startOfDay } from 'date-fns';
import { buildFairWeekSchedule } from '../fairScheduling';
import {
  createSoldier,
  createPlatoon,
  createTask,
  createNightTask,
  createConstraint,
  createAssignment,
  createScenario,
  createIdFactory,
  checkRuleViolations,
  hasNoViolations,
  resetIdCounter,
} from './fixtures';
import type { Soldier, Task, Platoon, Assignment } from '@/types/scheduling';

describe('Correctness Rules', () => {
  let weekStart: Date;

  beforeEach(() => {
    resetIdCounter();
    weekStart = startOfDay(new Date());
  });

  describe('Rest Time', () => {
    it('respects minimum rest between shifts', () => {
      const platoon = createPlatoon({ id: 'p1' });
      const soldier = createSoldier({ id: 's1', platoonId: 'p1' });

      // Task requires 8 hours rest
      const task = createTask({
        id: 't1',
        shiftStartHour: 8,
        shiftDuration: 4,
        restTimeBetweenShifts: 8,
        requiredRoles: [{ role: 'soldier', count: 1 }],
      });

      const result = buildFairWeekSchedule({
        weekStart,
        soldiers: [soldier],
        tasks: [task],
        platoons: [platoon],
        existingAssignments: [],
        idFactory: createIdFactory(),
      });

      // Should have assignments for each day
      const soldierAssignments = result.assignments
        .filter(a => a.soldierId === soldier.id)
        .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

      // Check rest between consecutive assignments
      for (let i = 0; i < soldierAssignments.length - 1; i++) {
        const endTime = new Date(soldierAssignments[i].endTime);
        const nextStartTime = new Date(soldierAssignments[i + 1].startTime);
        const restHours = (nextStartTime.getTime() - endTime.getTime()) / (1000 * 60 * 60);

        expect(restHours).toBeGreaterThanOrEqual(task.restTimeBetweenShifts);
      }
    });

    it('allows assignment when rest time is exactly met', () => {
      const platoon = createPlatoon({ id: 'p1' });
      const soldier = createSoldier({ id: 's1', platoonId: 'p1' });

      // Morning shift: 06:00-10:00 (4 hours)
      // Evening shift: 18:00-22:00 (4 hours)
      // Rest between: 8 hours (exactly meets requirement)
      const morningTask = createTask({
        id: 't1',
        name: 'בוקר',
        shiftStartHour: 6,
        shiftDuration: 4,
        restTimeBetweenShifts: 8,
        requiredRoles: [{ role: 'soldier', count: 1 }],
      });

      const eveningTask = createTask({
        id: 't2',
        name: 'ערב',
        shiftStartHour: 18,
        shiftDuration: 4,
        restTimeBetweenShifts: 8,
        requiredRoles: [{ role: 'soldier', count: 1 }],
      });

      const result = buildFairWeekSchedule({
        weekStart,
        soldiers: [soldier],
        tasks: [morningTask, eveningTask],
        platoons: [platoon],
        existingAssignments: [],
        idFactory: createIdFactory(),
      });

      // With only one soldier, they should be assigned to both tasks on day 1
      // because rest time is exactly met (10:00 to 18:00 = 8 hours)
      const day1Assignments = result.assignments.filter(a => {
        const start = new Date(a.startTime);
        return start >= weekStart && start < addDays(weekStart, 1);
      });

      // Should have 2 assignments on day 1 (both tasks filled by same soldier)
      expect(day1Assignments.length).toBe(2);
    });

    it('does not assign when rest time is insufficient', () => {
      const platoon = createPlatoon({ id: 'p1' });
      const soldier = createSoldier({ id: 's1', platoonId: 'p1' });

      // Morning shift: 08:00-12:00 (4 hours)
      // Afternoon shift: 14:00-18:00 (4 hours)
      // Rest between: only 2 hours (less than required 8)
      const morningTask = createTask({
        id: 't1',
        name: 'בוקר',
        shiftStartHour: 8,
        shiftDuration: 4,
        restTimeBetweenShifts: 8,
        requiredRoles: [{ role: 'soldier', count: 1 }],
      });

      const afternoonTask = createTask({
        id: 't2',
        name: 'צהריים',
        shiftStartHour: 14,
        shiftDuration: 4,
        restTimeBetweenShifts: 8,
        requiredRoles: [{ role: 'soldier', count: 1 }],
      });

      const result = buildFairWeekSchedule({
        weekStart,
        soldiers: [soldier],
        tasks: [morningTask, afternoonTask],
        platoons: [platoon],
        existingAssignments: [],
        idFactory: createIdFactory(),
      });

      // With only one soldier, they can only do one task per day
      // because rest time is insufficient
      const day1Assignments = result.assignments.filter(a => {
        const start = new Date(a.startTime);
        return start >= weekStart && start < addDays(weekStart, 1);
      });

      // Should have only 1 assignment on day 1 (second task unfilled)
      expect(day1Assignments.length).toBe(1);
      expect(result.unfilledSlots).toBeGreaterThan(0);
    });
  });

  describe('Night Shifts', () => {
    it('prevents consecutive night shifts', () => {
      const platoon = createPlatoon({ id: 'p1' });
      // Only one soldier - should not get two consecutive nights
      const soldier = createSoldier({ id: 's1', platoonId: 'p1' });

      const nightTask = createNightTask({
        id: 't1',
        shiftDuration: 6,
        restTimeBetweenShifts: 6,
        requiredRoles: [{ role: 'soldier', count: 1 }],
      });

      const result = buildFairWeekSchedule({
        weekStart,
        soldiers: [soldier],
        tasks: [nightTask],
        platoons: [platoon],
        existingAssignments: [],
        idFactory: createIdFactory(),
      });

      // Check for consecutive night violations
      const violations = checkRuleViolations(result.assignments, [soldier], [nightTask]);

      expect(violations.consecutiveNightViolations.length).toBe(0);
    });

    it('allows night shift after day shift', () => {
      const platoon = createPlatoon({ id: 'p1' });
      const soldier = createSoldier({ id: 's1', platoonId: 'p1' });

      const dayTask = createTask({
        id: 't1',
        name: 'יום',
        shiftStartHour: 8,
        shiftDuration: 8,
        restTimeBetweenShifts: 6,
        requiredRoles: [{ role: 'soldier', count: 1 }],
      });

      const nightTask = createNightTask({
        id: 't2',
        shiftDuration: 6,
        restTimeBetweenShifts: 6,
        requiredRoles: [{ role: 'soldier', count: 1 }],
      });

      const result = buildFairWeekSchedule({
        weekStart,
        soldiers: [soldier],
        tasks: [dayTask, nightTask],
        platoons: [platoon],
        existingAssignments: [],
        idFactory: createIdFactory(),
      });

      // Soldier can do day shift then night shift (if rest time allows)
      // This is allowed because it's not consecutive nights
      const violations = checkRuleViolations(result.assignments, [soldier], [dayTask, nightTask]);

      expect(violations.consecutiveNightViolations.length).toBe(0);
    });

    it('correctly identifies night shifts (22:00-06:00)', () => {
      const platoon = createPlatoon({ id: 'p1' });
      const soldiers = [
        createSoldier({ id: 's1', platoonId: 'p1' }),
        createSoldier({ id: 's2', platoonId: 'p1' }),
      ];

      // Task at 22:00 is a night shift
      const task22 = createTask({
        id: 't22',
        shiftStartHour: 22,
        shiftDuration: 6,
        restTimeBetweenShifts: 12,
        requiredRoles: [{ role: 'soldier', count: 1 }],
      });

      // Task at 05:00 is also a night shift
      const task05 = createTask({
        id: 't05',
        shiftStartHour: 5,
        shiftDuration: 3,
        restTimeBetweenShifts: 12,
        requiredRoles: [{ role: 'soldier', count: 1 }],
      });

      const result = buildFairWeekSchedule({
        weekStart,
        soldiers,
        tasks: [task22, task05],
        platoons: [platoon],
        existingAssignments: [],
        idFactory: createIdFactory(),
      });

      const violations = checkRuleViolations(result.assignments, soldiers, [task22, task05]);

      // No consecutive night violations should occur
      expect(violations.consecutiveNightViolations.length).toBe(0);
    });
  });

  describe('Constraints', () => {
    it('respects vacation constraints', () => {
      const platoon = createPlatoon({ id: 'p1' });
      const vacationStart = addDays(weekStart, 1);
      const vacationEnd = addDays(weekStart, 3);

      const soldier = createSoldier({
        id: 's1',
        platoonId: 'p1',
        constraints: [
          createConstraint({
            type: 'vacation',
            startDate: vacationStart,
            endDate: vacationEnd,
          }),
        ],
      });

      const task = createTask({
        id: 't1',
        requiredRoles: [{ role: 'soldier', count: 1 }],
      });

      const result = buildFairWeekSchedule({
        weekStart,
        soldiers: [soldier],
        tasks: [task],
        platoons: [platoon],
        existingAssignments: [],
        idFactory: createIdFactory(),
      });

      const violations = checkRuleViolations(result.assignments, [soldier], [task]);

      expect(violations.constraintViolations.length).toBe(0);

      // Check no assignments during vacation
      const vacationAssignments = result.assignments.filter(a => {
        const start = new Date(a.startTime);
        return start >= vacationStart && start <= vacationEnd;
      });

      expect(vacationAssignments.length).toBe(0);
    });

    it('respects medical constraints', () => {
      const platoon = createPlatoon({ id: 'p1' });

      const soldier = createSoldier({
        id: 's1',
        platoonId: 'p1',
        constraints: [
          createConstraint({
            type: 'medical',
            startDate: weekStart,
            endDate: addDays(weekStart, 7),
            reason: 'גבס ברגל',
          }),
        ],
      });

      const task = createTask({
        id: 't1',
        requiredRoles: [{ role: 'soldier', count: 1 }],
      });

      const result = buildFairWeekSchedule({
        weekStart,
        soldiers: [soldier],
        tasks: [task],
        platoons: [platoon],
        existingAssignments: [],
        idFactory: createIdFactory(),
      });

      // Soldier should have no assignments due to medical constraint
      const soldierAssignments = result.assignments.filter(a => a.soldierId === soldier.id);

      expect(soldierAssignments.length).toBe(0);
    });

    it('respects unavailable constraints', () => {
      const platoon = createPlatoon({ id: 'p1' });
      const unavailableDay = addDays(weekStart, 2);

      const soldier = createSoldier({
        id: 's1',
        platoonId: 'p1',
        constraints: [
          createConstraint({
            type: 'unavailable',
            startDate: unavailableDay,
            endDate: unavailableDay,
          }),
        ],
      });

      const task = createTask({
        id: 't1',
        requiredRoles: [{ role: 'soldier', count: 1 }],
      });

      const result = buildFairWeekSchedule({
        weekStart,
        soldiers: [soldier],
        tasks: [task],
        platoons: [platoon],
        existingAssignments: [],
        idFactory: createIdFactory(),
      });

      const violations = checkRuleViolations(result.assignments, [soldier], [task]);

      expect(violations.constraintViolations.length).toBe(0);
    });

    it('handles constraint that spans multiple days', () => {
      const platoon = createPlatoon({ id: 'p1' });

      // Constraint covers days 0-4 (5 days)
      const constraintStart = weekStart;
      const constraintEnd = addDays(weekStart, 4);

      const soldier = createSoldier({
        id: 's1',
        platoonId: 'p1',
        constraints: [
          createConstraint({
            type: 'vacation',
            startDate: constraintStart,
            endDate: constraintEnd,
          }),
        ],
      });

      const task = createTask({
        id: 't1',
        shiftStartHour: 8,
        shiftDuration: 8,
        requiredRoles: [{ role: 'soldier', count: 1 }],
      });

      const result = buildFairWeekSchedule({
        weekStart,
        soldiers: [soldier],
        tasks: [task],
        platoons: [platoon],
        existingAssignments: [],
        idFactory: createIdFactory(),
      });

      const violations = checkRuleViolations(result.assignments, [soldier], [task]);

      // The key assertion: no constraint violations
      expect(violations.constraintViolations.length).toBe(0);

      // Verify soldier only gets assignments outside the constraint period
      const soldierAssignments = result.assignments.filter(a => a.soldierId === soldier.id);
      for (const a of soldierAssignments) {
        const aStart = new Date(a.startTime);
        const aEnd = new Date(a.endTime);
        // Should not overlap with constraint
        const overlapsConstraint = aStart <= constraintEnd && aEnd >= constraintStart;
        expect(overlapsConstraint).toBe(false);
      }
    });
  });

  describe('Roles', () => {
    it('assigns drivers only to soldiers with driver role', () => {
      const platoon = createPlatoon({ id: 'p1' });

      const driver = createSoldier({ id: 's1', platoonId: 'p1', roles: ['soldier', 'driver'] });
      const regularSoldier = createSoldier({ id: 's2', platoonId: 'p1', roles: ['soldier'] });

      const task = createTask({
        id: 't1',
        requiredRoles: [{ role: 'driver', count: 1 }],
      });

      const result = buildFairWeekSchedule({
        weekStart,
        soldiers: [driver, regularSoldier],
        tasks: [task],
        platoons: [platoon],
        existingAssignments: [],
        idFactory: createIdFactory(),
      });

      const violations = checkRuleViolations(result.assignments, [driver, regularSoldier], [task]);

      expect(violations.roleViolations.length).toBe(0);

      // All driver assignments should be to the driver
      const driverAssignments = result.assignments.filter(a => a.role === 'driver');
      driverAssignments.forEach(a => {
        expect(a.soldierId).toBe(driver.id);
      });
    });

    it('assigns commanders only to soldiers with commander role', () => {
      const platoon = createPlatoon({ id: 'p1' });

      const commander = createSoldier({ id: 's1', platoonId: 'p1', roles: ['soldier', 'commander'] });
      const regularSoldier = createSoldier({ id: 's2', platoonId: 'p1', roles: ['soldier'] });

      const task = createTask({
        id: 't1',
        requiredRoles: [
          { role: 'commander', count: 1 },
          { role: 'soldier', count: 1 },
        ],
      });

      const result = buildFairWeekSchedule({
        weekStart,
        soldiers: [commander, regularSoldier],
        tasks: [task],
        platoons: [platoon],
        existingAssignments: [],
        idFactory: createIdFactory(),
      });

      const violations = checkRuleViolations(result.assignments, [commander, regularSoldier], [task]);

      expect(violations.roleViolations.length).toBe(0);

      // All commander assignments should be to the commander
      const commanderAssignments = result.assignments.filter(a => a.role === 'commander');
      commanderAssignments.forEach(a => {
        expect(a.soldierId).toBe(commander.id);
      });
    });

    it('assigns any soldier to "soldier" role', () => {
      const platoon = createPlatoon({ id: 'p1' });

      // All types of soldiers can fill "soldier" role
      const soldiers = [
        createSoldier({ id: 's1', platoonId: 'p1', roles: ['soldier'] }),
        createSoldier({ id: 's2', platoonId: 'p1', roles: ['soldier', 'driver'] }),
        createSoldier({ id: 's3', platoonId: 'p1', roles: ['soldier', 'commander'] }),
      ];

      const task = createTask({
        id: 't1',
        requiredRoles: [{ role: 'soldier', count: 2 }],
      });

      const result = buildFairWeekSchedule({
        weekStart,
        soldiers,
        tasks: [task],
        platoons: [platoon],
        existingAssignments: [],
        idFactory: createIdFactory(),
      });

      const violations = checkRuleViolations(result.assignments, soldiers, [task]);

      expect(violations.roleViolations.length).toBe(0);
    });

    it('reports unfilled when no qualified soldier available for role', () => {
      const platoon = createPlatoon({ id: 'p1' });

      // No drivers in the platoon
      const soldiers = [
        createSoldier({ id: 's1', platoonId: 'p1', roles: ['soldier'] }),
        createSoldier({ id: 's2', platoonId: 'p1', roles: ['soldier'] }),
      ];

      const task = createTask({
        id: 't1',
        requiredRoles: [{ role: 'driver', count: 1 }],
      });

      const result = buildFairWeekSchedule({
        weekStart,
        soldiers,
        tasks: [task],
        platoons: [platoon],
        existingAssignments: [],
        idFactory: createIdFactory(),
      });

      // Should have unfilled slots for all 7 days
      expect(result.unfilledSlots).toBe(7);
    });
  });

  describe('Conflicts', () => {
    it('prevents overlapping assignments for same soldier', () => {
      const platoon = createPlatoon({ id: 'p1' });
      const soldier = createSoldier({ id: 's1', platoonId: 'p1' });

      // Two tasks at the same time
      const task1 = createTask({
        id: 't1',
        shiftStartHour: 8,
        shiftDuration: 4,
        restTimeBetweenShifts: 4,
        requiredRoles: [{ role: 'soldier', count: 1 }],
      });

      const task2 = createTask({
        id: 't2',
        shiftStartHour: 10, // Overlaps with task1 (08:00-12:00)
        shiftDuration: 4,
        restTimeBetweenShifts: 4,
        requiredRoles: [{ role: 'soldier', count: 1 }],
      });

      const result = buildFairWeekSchedule({
        weekStart,
        soldiers: [soldier],
        tasks: [task1, task2],
        platoons: [platoon],
        existingAssignments: [],
        idFactory: createIdFactory(),
      });

      const violations = checkRuleViolations(result.assignments, [soldier], [task1, task2]);

      expect(violations.overlapViolations.length).toBe(0);
    });

    it('allows adjacent non-overlapping assignments with zero rest time', () => {
      const platoon = createPlatoon({ id: 'p1' });
      // Need 2 soldiers to fill 2 tasks per day
      const soldiers = [
        createSoldier({ id: 's1', platoonId: 'p1' }),
        createSoldier({ id: 's2', platoonId: 'p1' }),
      ];

      // Task1: 08:00-12:00
      // Task2: 12:00-16:00 (adjacent, not overlapping)
      const task1 = createTask({
        id: 't1',
        shiftStartHour: 8,
        shiftDuration: 4,
        restTimeBetweenShifts: 0, // No rest required
        requiredRoles: [{ role: 'soldier', count: 1 }],
      });

      const task2 = createTask({
        id: 't2',
        shiftStartHour: 12,
        shiftDuration: 4,
        restTimeBetweenShifts: 0, // No rest required
        requiredRoles: [{ role: 'soldier', count: 1 }],
      });

      const result = buildFairWeekSchedule({
        weekStart,
        soldiers,
        tasks: [task1, task2],
        platoons: [platoon],
        existingAssignments: [],
        idFactory: createIdFactory(),
      });

      // Should be able to fill both tasks (with different soldiers)
      expect(result.unfilledSlots).toBe(0);

      const violations = checkRuleViolations(result.assignments, soldiers, [task1, task2]);
      expect(violations.overlapViolations.length).toBe(0);
    });
  });

  describe('Locks', () => {
    it('preserves locked assignments', () => {
      const platoon = createPlatoon({ id: 'p1' });
      const soldiers = [
        createSoldier({ id: 's1', platoonId: 'p1' }),
        createSoldier({ id: 's2', platoonId: 'p1' }),
      ];

      const task = createTask({
        id: 't1',
        requiredRoles: [{ role: 'soldier', count: 1 }],
      });

      const day1Start = addHours(weekStart, task.shiftStartHour);
      const day1End = addHours(day1Start, task.shiftDuration);

      const lockedAssignment = createAssignment({
        id: 'locked-1',
        taskId: task.id,
        soldierId: 's1',
        startTime: day1Start,
        endTime: day1End,
        locked: true,
      });

      const result = buildFairWeekSchedule({
        weekStart,
        soldiers,
        tasks: [task],
        platoons: [platoon],
        existingAssignments: [lockedAssignment],
        idFactory: createIdFactory(),
      });

      // Find the locked assignment in results
      const preserved = result.assignments.find(
        a => a.id === 'locked-1'
      );

      expect(preserved).toBeDefined();
      expect(preserved?.locked).toBe(true);
      expect(preserved?.soldierId).toBe('s1');
    });

    it('works around locked assignments for same slot', () => {
      const platoon = createPlatoon({ id: 'p1' });
      const soldiers = [
        createSoldier({ id: 's1', platoonId: 'p1' }),
        createSoldier({ id: 's2', platoonId: 'p1' }),
      ];

      const task = createTask({
        id: 't1',
        requiredRoles: [{ role: 'soldier', count: 2 }],
      });

      const day1Start = addHours(weekStart, task.shiftStartHour);
      const day1End = addHours(day1Start, task.shiftDuration);

      // Lock s1 to day 1
      const lockedAssignment = createAssignment({
        id: 'locked-1',
        taskId: task.id,
        soldierId: 's1',
        startTime: day1Start,
        endTime: day1End,
        locked: true,
      });

      const result = buildFairWeekSchedule({
        weekStart,
        soldiers,
        tasks: [task],
        platoons: [platoon],
        existingAssignments: [lockedAssignment],
        idFactory: createIdFactory(),
      });

      // Day 1 should have both soldiers (locked s1 + auto-assigned s2)
      const day1Assignments = result.assignments.filter(a => {
        const start = new Date(a.startTime);
        return start >= weekStart && start < addDays(weekStart, 1);
      });

      expect(day1Assignments.length).toBe(2);
      expect(day1Assignments.map(a => a.soldierId).sort()).toEqual(['s1', 's2']);
    });

    it('respects locked platoon when filling remaining roles', () => {
      const platoons = [
        createPlatoon({ id: 'p1', name: "מחלקה א'" }),
        createPlatoon({ id: 'p2', name: "מחלקה ב'" }),
      ];

      const soldiers = [
        createSoldier({ id: 's1', platoonId: 'p1' }),
        createSoldier({ id: 's2', platoonId: 'p1' }),
        createSoldier({ id: 's3', platoonId: 'p2' }),
        createSoldier({ id: 's4', platoonId: 'p2' }),
      ];

      const task = createTask({
        id: 't1',
        requiredRoles: [{ role: 'soldier', count: 2 }],
      });

      const day1Start = addHours(weekStart, task.shiftStartHour);
      const day1End = addHours(day1Start, task.shiftDuration);

      // Lock soldier from platoon 1
      const lockedAssignment = createAssignment({
        id: 'locked-1',
        taskId: task.id,
        soldierId: 's1',
        startTime: day1Start,
        endTime: day1End,
        locked: true,
      });

      const result = buildFairWeekSchedule({
        weekStart,
        soldiers,
        tasks: [task],
        platoons,
        existingAssignments: [lockedAssignment],
        idFactory: createIdFactory(),
      });

      // Day 1 should have both soldiers from platoon 1
      const day1Assignments = result.assignments.filter(a => {
        const start = new Date(a.startTime);
        return start >= weekStart && start < addDays(weekStart, 1);
      });

      expect(day1Assignments.length).toBe(2);

      // Both should be from platoon 1
      const assignedSoldierIds = day1Assignments.map(a => a.soldierId);
      const assignedSoldiers = soldiers.filter(s => assignedSoldierIds.includes(s.id));
      assignedSoldiers.forEach(s => {
        expect(s.platoonId).toBe('p1');
      });
    });
  });

  describe('Full Scenario - No Violations', () => {
    it('produces valid schedule for standard scenario', () => {
      const scenario = createScenario({
        platoonCount: 3,
        soldiersPerPlatoon: 10,
        taskCount: 2,
        driverPercentage: 20,
        commanderPercentage: 10,
      });

      const result = buildFairWeekSchedule({
        weekStart: scenario.weekStart,
        soldiers: scenario.soldiers,
        tasks: scenario.tasks,
        platoons: scenario.platoons,
        existingAssignments: [],
        idFactory: createIdFactory(),
      });

      const violations = checkRuleViolations(
        result.assignments,
        scenario.soldiers,
        scenario.tasks
      );

      expect(hasNoViolations(violations)).toBe(true);
      expect(result.unfilledSlots).toBe(0);
    });
  });
});
