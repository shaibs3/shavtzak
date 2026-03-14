import { addDays } from 'date-fns';
import type { Soldier, Task, Platoon, Assignment, Constraint, Role } from '@/types/scheduling';

// Counter for generating unique IDs
let idCounter = 0;

export function resetIdCounter() {
  idCounter = 0;
}

export function makeId(prefix = 'id'): string {
  return `${prefix}-${++idCounter}`;
}

// Deterministic ID factory for tests (no randomness)
export function createIdFactory(): () => string {
  let counter = 0;
  return () => `test-${++counter}`;
}

// ============== Soldier Creation ==============

export interface CreateSoldierOptions {
  id?: string;
  name?: string;
  rank?: string;
  roles?: Role[];
  platoonId?: string | null;
  constraints?: Constraint[];
  maxVacationDays?: number;
  usedVacationDays?: number;
}

export function createSoldier(options: CreateSoldierOptions = {}): Soldier {
  const id = options.id ?? makeId('soldier');
  return {
    id,
    name: options.name ?? `חייל ${id}`,
    rank: options.rank ?? 'טוראי',
    roles: options.roles ?? ['soldier'],
    platoonId: options.platoonId ?? null,
    constraints: options.constraints ?? [],
    maxVacationDays: options.maxVacationDays ?? 5,
    usedVacationDays: options.usedVacationDays ?? 0,
  };
}

// ============== Constraint Creation ==============

export interface CreateConstraintOptions {
  id?: string;
  type?: 'vacation' | 'medical' | 'unavailable' | 'other';
  startDate: Date;
  endDate: Date;
  reason?: string;
}

export function createConstraint(options: CreateConstraintOptions): Constraint {
  return {
    id: options.id ?? makeId('constraint'),
    type: options.type ?? 'unavailable',
    startDate: options.startDate,
    endDate: options.endDate,
    reason: options.reason,
  };
}

// ============== Platoon Creation ==============

export interface CreatePlatoonOptions {
  id?: string;
  name?: string;
  commander?: string | null;
  color?: string;
  description?: string | null;
}

export function createPlatoon(options: CreatePlatoonOptions = {}): Platoon {
  const id = options.id ?? makeId('platoon');
  return {
    id,
    name: options.name ?? `מחלקה ${id}`,
    commander: options.commander ?? null,
    color: options.color ?? '#3B82F6',
    description: options.description ?? null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

// ============== Task Creation ==============

export interface CreateTaskOptions {
  id?: string;
  name?: string;
  description?: string;
  shiftStartHour?: number;
  shiftDuration?: number;
  restTimeBetweenShifts?: number;
  isActive?: boolean;
  requiredRoles?: { role: Role; count: number }[];
}

export function createTask(options: CreateTaskOptions = {}): Task {
  const id = options.id ?? makeId('task');
  return {
    id,
    name: options.name ?? `משימה ${id}`,
    description: options.description,
    shiftStartHour: options.shiftStartHour ?? 8,
    shiftDuration: options.shiftDuration ?? 8,
    restTimeBetweenShifts: options.restTimeBetweenShifts ?? 8,
    isActive: options.isActive ?? true,
    requiredRoles: options.requiredRoles ?? [{ role: 'soldier', count: 2 }],
  };
}

// Night shift task (starts at 22:00)
export function createNightTask(options: Omit<CreateTaskOptions, 'shiftStartHour'> = {}): Task {
  return createTask({
    ...options,
    name: options.name ?? 'משמרת לילה',
    shiftStartHour: 22,
    shiftDuration: options.shiftDuration ?? 8,
  });
}

// ============== Assignment Creation ==============

export interface CreateAssignmentOptions {
  id?: string;
  taskId: string;
  soldierId: string;
  role?: Role;
  startTime: Date;
  endTime: Date;
  locked?: boolean;
}

export function createAssignment(options: CreateAssignmentOptions): Assignment {
  return {
    id: options.id ?? makeId('assignment'),
    taskId: options.taskId,
    soldierId: options.soldierId,
    role: options.role ?? 'soldier',
    startTime: options.startTime,
    endTime: options.endTime,
    locked: options.locked ?? false,
  };
}

// ============== Scenario Creation ==============

export interface ScenarioConfig {
  platoonCount: number;
  soldiersPerPlatoon: number;
  taskCount?: number;
  tasks?: CreateTaskOptions[];
  // Percentage of soldiers that have driver role (0-100)
  driverPercentage?: number;
  // Percentage of soldiers that have commander role (0-100)
  commanderPercentage?: number;
}

export interface Scenario {
  platoons: Platoon[];
  soldiers: Soldier[];
  tasks: Task[];
  weekStart: Date;
}

export function createScenario(config: ScenarioConfig): Scenario {
  resetIdCounter();

  const platoons: Platoon[] = [];
  const soldiers: Soldier[] = [];

  // Create platoons and their soldiers
  for (let p = 0; p < config.platoonCount; p++) {
    const platoon = createPlatoon({
      name: `מחלקה ${String.fromCharCode(1488 + p)}'`, // א', ב', ג', etc.
    });
    platoons.push(platoon);

    for (let s = 0; s < config.soldiersPerPlatoon; s++) {
      const soldierIndex = p * config.soldiersPerPlatoon + s;
      const roles: Role[] = ['soldier'];

      // Add driver role based on percentage
      if (config.driverPercentage && (soldierIndex % Math.ceil(100 / config.driverPercentage)) === 0) {
        roles.push('driver');
      }

      // Add commander role based on percentage
      if (config.commanderPercentage && (soldierIndex % Math.ceil(100 / config.commanderPercentage)) === 0) {
        roles.push('commander');
      }

      soldiers.push(createSoldier({
        platoonId: platoon.id,
        roles,
      }));
    }
  }

  // Create tasks
  let tasks: Task[] = [];
  if (config.tasks) {
    tasks = config.tasks.map(t => createTask(t));
  } else {
    const taskCount = config.taskCount ?? 2;
    for (let t = 0; t < taskCount; t++) {
      tasks.push(createTask({
        name: t === 0 ? 'משמרת בוקר' : t === 1 ? 'משמרת ערב' : `משימה ${t + 1}`,
        shiftStartHour: t === 0 ? 6 : t === 1 ? 14 : 8 + t * 2,
      }));
    }
  }

  // Week start is always the coming Sunday
  const now = new Date();
  const dayOfWeek = now.getDay();
  const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
  const weekStart = addDays(new Date(now.getFullYear(), now.getMonth(), now.getDate()), daysUntilSunday);

  return { platoons, soldiers, tasks, weekStart };
}

// ============== Statistics Helpers ==============

export interface SoldierStats {
  soldierId: string;
  hours: number;
  assignmentCount: number;
}

export interface PlatoonStats {
  platoonId: string;
  totalHours: number;
  soldierCount: number;
  avgHoursPerSoldier: number;
}

export interface FairnessMetrics {
  soldierStats: SoldierStats[];
  platoonStats: PlatoonStats[];
  soldierHoursStdDev: number;
  soldierHoursDeviation: number; // percentage
  platoonHoursStdDev: number;
  platoonHoursDeviation: number; // percentage
}

export function calculateFairnessMetrics(
  assignments: Assignment[],
  soldiers: Soldier[],
  platoons: Platoon[],
  tasks: Task[],
): FairnessMetrics {
  const tasksById = new Map(tasks.map(t => [t.id, t]));

  // Calculate hours per soldier
  const hoursBySoldier = new Map<string, number>();
  const countBySoldier = new Map<string, number>();

  for (const a of assignments) {
    const task = tasksById.get(a.taskId);
    const duration = task?.shiftDuration ?? 0;
    hoursBySoldier.set(a.soldierId, (hoursBySoldier.get(a.soldierId) ?? 0) + duration);
    countBySoldier.set(a.soldierId, (countBySoldier.get(a.soldierId) ?? 0) + 1);
  }

  // Build soldier stats (only for soldiers who got assignments)
  const soldierStats: SoldierStats[] = soldiers
    .filter(s => hoursBySoldier.has(s.id))
    .map(s => ({
      soldierId: s.id,
      hours: hoursBySoldier.get(s.id) ?? 0,
      assignmentCount: countBySoldier.get(s.id) ?? 0,
    }));

  // Calculate hours per platoon
  const hoursByPlatoon = new Map<string, number>();
  const soldierCountByPlatoon = new Map<string, number>();

  for (const soldier of soldiers) {
    if (soldier.platoonId) {
      const current = soldierCountByPlatoon.get(soldier.platoonId) ?? 0;
      soldierCountByPlatoon.set(soldier.platoonId, current + 1);

      const hours = hoursBySoldier.get(soldier.id) ?? 0;
      hoursByPlatoon.set(soldier.platoonId, (hoursByPlatoon.get(soldier.platoonId) ?? 0) + hours);
    }
  }

  // Build platoon stats
  const platoonStats: PlatoonStats[] = platoons.map(p => ({
    platoonId: p.id,
    totalHours: hoursByPlatoon.get(p.id) ?? 0,
    soldierCount: soldierCountByPlatoon.get(p.id) ?? 0,
    avgHoursPerSoldier: (hoursByPlatoon.get(p.id) ?? 0) / (soldierCountByPlatoon.get(p.id) ?? 1),
  }));

  // Calculate standard deviation for soldier hours
  const soldierHours = soldierStats.map(s => s.hours);
  const soldierHoursStdDev = calculateStdDev(soldierHours);
  const soldierAvg = soldierHours.reduce((a, b) => a + b, 0) / (soldierHours.length || 1);
  const soldierHoursDeviation = soldierAvg > 0 ? (soldierHoursStdDev / soldierAvg) * 100 : 0;

  // Calculate standard deviation for platoon hours
  const platoonHours = platoonStats.map(p => p.avgHoursPerSoldier);
  const platoonHoursStdDev = calculateStdDev(platoonHours);
  const platoonAvg = platoonHours.reduce((a, b) => a + b, 0) / (platoonHours.length || 1);
  const platoonHoursDeviation = platoonAvg > 0 ? (platoonHoursStdDev / platoonAvg) * 100 : 0;

  return {
    soldierStats,
    platoonStats,
    soldierHoursStdDev,
    soldierHoursDeviation,
    platoonHoursStdDev,
    platoonHoursDeviation,
  };
}

function calculateStdDev(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
  const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
  return Math.sqrt(avgSquaredDiff);
}

// ============== Rule Violation Checkers ==============

export interface RuleViolations {
  restTimeViolations: Array<{
    soldierId: string;
    assignment1: Assignment;
    assignment2: Assignment;
    actualRest: number;
    requiredRest: number;
  }>;
  consecutiveNightViolations: Array<{
    soldierId: string;
    night1: Assignment;
    night2: Assignment;
  }>;
  constraintViolations: Array<{
    soldierId: string;
    assignment: Assignment;
    constraint: Constraint;
  }>;
  roleViolations: Array<{
    soldierId: string;
    assignment: Assignment;
    requiredRole: Role;
    soldierRoles: Role[];
  }>;
  overlapViolations: Array<{
    soldierId: string;
    assignment1: Assignment;
    assignment2: Assignment;
  }>;
}

export function checkRuleViolations(
  assignments: Assignment[],
  soldiers: Soldier[],
  tasks: Task[],
): RuleViolations {
  const violations: RuleViolations = {
    restTimeViolations: [],
    consecutiveNightViolations: [],
    constraintViolations: [],
    roleViolations: [],
    overlapViolations: [],
  };

  const tasksById = new Map(tasks.map(t => [t.id, t]));
  const soldiersById = new Map(soldiers.map(s => [s.id, s]));

  // Group assignments by soldier
  const assignmentsBySoldier = new Map<string, Assignment[]>();
  for (const a of assignments) {
    const list = assignmentsBySoldier.get(a.soldierId) ?? [];
    list.push(a);
    assignmentsBySoldier.set(a.soldierId, list);
  }

  for (const [soldierId, soldierAssignments] of assignmentsBySoldier) {
    const soldier = soldiersById.get(soldierId);
    if (!soldier) continue;

    // Sort by start time
    const sorted = soldierAssignments
      .map(a => ({
        ...a,
        startTime: a.startTime instanceof Date ? a.startTime : new Date(a.startTime),
        endTime: a.endTime instanceof Date ? a.endTime : new Date(a.endTime),
      }))
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

    for (let i = 0; i < sorted.length; i++) {
      const assignment = sorted[i];
      const task = tasksById.get(assignment.taskId);

      // Check role violations
      if (assignment.role !== 'soldier' && !soldier.roles.includes(assignment.role)) {
        violations.roleViolations.push({
          soldierId,
          assignment,
          requiredRole: assignment.role,
          soldierRoles: soldier.roles,
        });
      }

      // Check constraint violations
      for (const constraint of soldier.constraints) {
        const cStart = constraint.startDate instanceof Date ? constraint.startDate : new Date(constraint.startDate);
        const cEnd = constraint.endDate instanceof Date ? constraint.endDate : new Date(constraint.endDate);

        if (assignment.startTime <= cEnd && assignment.endTime >= cStart) {
          violations.constraintViolations.push({
            soldierId,
            assignment,
            constraint,
          });
        }
      }

      // Check against next assignment
      if (i < sorted.length - 1) {
        const nextAssignment = sorted[i + 1];
        const nextTask = tasksById.get(nextAssignment.taskId);

        // Check overlap
        if (assignment.endTime > nextAssignment.startTime) {
          violations.overlapViolations.push({
            soldierId,
            assignment1: assignment,
            assignment2: nextAssignment,
          });
        }

        // Check rest time
        if (task) {
          const restHours = (nextAssignment.startTime.getTime() - assignment.endTime.getTime()) / (1000 * 60 * 60);
          if (restHours < task.restTimeBetweenShifts) {
            violations.restTimeViolations.push({
              soldierId,
              assignment1: assignment,
              assignment2: nextAssignment,
              actualRest: restHours,
              requiredRest: task.restTimeBetweenShifts,
            });
          }
        }

        // Check consecutive night shifts
        const isNight = (t: Task | undefined) => {
          if (!t) return false;
          const h = t.shiftStartHour;
          return h >= 22 || h < 6;
        };

        if (isNight(task) && isNight(nextTask)) {
          // Check if they're on consecutive days
          const day1 = Math.floor(assignment.startTime.getTime() / (1000 * 60 * 60 * 24));
          const day2 = Math.floor(nextAssignment.startTime.getTime() / (1000 * 60 * 60 * 24));

          if (day2 - day1 === 1) {
            violations.consecutiveNightViolations.push({
              soldierId,
              night1: assignment,
              night2: nextAssignment,
            });
          }
        }
      }
    }
  }

  return violations;
}

export function hasNoViolations(violations: RuleViolations): boolean {
  return (
    violations.restTimeViolations.length === 0 &&
    violations.consecutiveNightViolations.length === 0 &&
    violations.constraintViolations.length === 0 &&
    violations.roleViolations.length === 0 &&
    violations.overlapViolations.length === 0
  );
}
