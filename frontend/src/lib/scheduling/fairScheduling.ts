import { addDays, addHours, differenceInHours, isWithinInterval, startOfDay } from 'date-fns';
import type { Assignment, Role, Soldier, Task, Platoon } from '@/types/scheduling';

type BuildScheduleParams = {
  weekStart: Date;
  soldiers: Soldier[];
  tasks: Task[];
  platoons: Platoon[];
  existingAssignments: Assignment[];
  idFactory?: () => string;
};

const defaultIdFactory = () => Math.random().toString(36).substring(2, 11);

function asDate(value: unknown): Date {
  if (value instanceof Date) return value;
  if (typeof value === 'string' || typeof value === 'number') return new Date(value);
  return new Date(String(value));
}

function isNightShift(task: Task): boolean {
  const h = task.shiftStartHour;
  return h >= 22 || h < 6;
}

function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
  // inclusive overlap check
  return aStart <= bEnd && bStart <= aEnd;
}

function soldierIsAvailableForInterval(soldier: Soldier, start: Date, end: Date) {
  return !soldier.constraints.some((c) => {
    const cStart = asDate(c.startDate);
    const cEnd = asDate(c.endDate);
    return overlaps(cStart, cEnd, start, end);
  });
}

function getLastAssignmentBefore(assignments: Assignment[], soldierId: string, start: Date) {
  const relevant = assignments
    .filter((a) => a.soldierId === soldierId)
    .map((a) => ({ ...a, startTime: asDate(a.startTime), endTime: asDate(a.endTime) }))
    .filter((a) => a.endTime <= start)
    .sort((a, b) => b.endTime.getTime() - a.endTime.getTime());
  return relevant[0];
}

function hasNightPreviousDay(assignments: Assignment[], soldierId: string, dayStart: Date, tasksById: Map<string, Task>) {
  const prevDayStart = addDays(startOfDay(dayStart), -1);
  const prevDayEnd = addHours(prevDayStart, 24);

  return assignments
    .filter((a) => a.soldierId === soldierId)
    .some((a) => {
      const aStart = asDate(a.startTime);
      if (!(aStart >= prevDayStart && aStart < prevDayEnd)) return false;
      const task = tasksById.get(a.taskId);
      return task ? isNightShift(task) : false;
    });
}

function weekWindow(weekStart: Date) {
  const start = startOfDay(weekStart);
  const end = addDays(start, 7);
  return { start, end };
}

export function buildFairWeekSchedule({ weekStart, soldiers, tasks, platoons, existingAssignments, idFactory }: BuildScheduleParams) {
  const makeId = idFactory ?? defaultIdFactory;
  const { start: wStart, end: wEnd } = weekWindow(weekStart);

  const tasksById = new Map(tasks.map((t) => [t.id, t]));
  const activeTasks = tasks.filter((t) => t.isActive);

  const inWeek = (a: Assignment) => {
    const s = asDate(a.startTime);
    return s >= wStart && s < wEnd;
  };

  // Keep locked assignments as-is; remove any non-locked assignments inside the week.
  const preserved = existingAssignments.filter((a) => !inWeek(a) || a.locked);
  let working: Assignment[] = preserved.slice();

  // Fairness trackers (for this generated week only)
  const weekAssignments = () => working.filter(inWeek);
  const hoursBySoldier = new Map<string, number>();
  const countBySoldier = new Map<string, number>();
  const hoursByPlatoon = new Map<string, number>();

  for (const a of weekAssignments()) {
    const task = tasksById.get(a.taskId);
    const duration = task?.shiftDuration ?? Math.max(0, differenceInHours(asDate(a.endTime), asDate(a.startTime)));
    hoursBySoldier.set(a.soldierId, (hoursBySoldier.get(a.soldierId) ?? 0) + duration);
    countBySoldier.set(a.soldierId, (countBySoldier.get(a.soldierId) ?? 0) + 1);

    const soldier = soldiers.find(s => s.id === a.soldierId);
    if (soldier?.platoonId) {
      hoursByPlatoon.set(soldier.platoonId, (hoursByPlatoon.get(soldier.platoonId) ?? 0) + duration);
    }
  }

  const addToWeekStats = (soldierId: string, duration: number) => {
    hoursBySoldier.set(soldierId, (hoursBySoldier.get(soldierId) ?? 0) + duration);
    countBySoldier.set(soldierId, (countBySoldier.get(soldierId) ?? 0) + 1);

    const soldier = soldiers.find(s => s.id === soldierId);
    if (soldier?.platoonId) {
      hoursByPlatoon.set(soldier.platoonId, (hoursByPlatoon.get(soldier.platoonId) ?? 0) + duration);
    }
  };

  let unfilledSlots = 0;

  for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
    const day = addDays(wStart, dayIndex);

    for (const task of activeTasks) {
      const start = addHours(startOfDay(day), task.shiftStartHour);
      const end = addHours(start, task.shiftDuration);

      // Check for locked assignments for this task/day
      const lockedForSlot = working.filter(
        (a) =>
          a.locked &&
          a.taskId === task.id &&
          isWithinInterval(asDate(a.startTime), { start: startOfDay(day), end: addHours(startOfDay(day), 24) }),
      );

      // Determine which platoon is locked (if any)
      const lockedPlatoons = new Set(
        lockedForSlot
          .map(a => soldiers.find(s => s.id === a.soldierId)?.platoonId)
          .filter(Boolean) as string[]
      );
      const requiredPlatoonId = lockedPlatoons.size === 1 ? Array.from(lockedPlatoons)[0] : null;

      // Calculate what roles are still needed
      const lockedCountsByRole = lockedForSlot.reduce<Record<Role, number>>((acc, a) => {
        acc[a.role] = (acc[a.role] ?? 0) + 1;
        return acc;
      }, {} as Record<Role, number>);

      const neededRoles: { role: Role; count: number }[] = [];
      for (const req of task.requiredRoles) {
        const already = lockedCountsByRole[req.role] ?? 0;
        const needed = Math.max(0, req.count - already);
        if (needed > 0) {
          neededRoles.push({ role: req.role, count: needed });
        }
      }

      if (neededRoles.length === 0) continue; // All filled by locked assignments

      // Try to assign from a single platoon
      const platoonsToTry = requiredPlatoonId
        ? [platoons.find(p => p.id === requiredPlatoonId)!]
        : platoons
            .slice()
            .sort((a, b) => {
              const hoursA = hoursByPlatoon.get(a.id) ?? 0;
              const hoursB = hoursByPlatoon.get(b.id) ?? 0;
              // If hours are equal, use day rotation to vary the order
              if (hoursA === hoursB) {
                // Rotate platoons based on day index to ensure fairness
                const indexA = platoons.indexOf(a);
                const indexB = platoons.indexOf(b);
                const rotatedA = (indexA + dayIndex) % platoons.length;
                const rotatedB = (indexB + dayIndex) % platoons.length;
                return rotatedA - rotatedB;
              }
              return hoursA - hoursB;
            });

      let assigned = false;

      for (const platoon of platoonsToTry) {
        // Try to find all required soldiers from this platoon
        const platoonSoldiers = soldiers.filter(s => s.platoonId === platoon.id);
        const assignments: Assignment[] = [];
        let canFulfill = true;

        for (const needed of neededRoles) {
          for (let i = 0; i < needed.count; i++) {
            const alreadyUsedInThisSlot = new Set(assignments.map(a => a.soldierId));

            const candidates = platoonSoldiers
              .filter((s) => {
                // If role is 'soldier', everyone can fill it (everyone is a soldier by default)
                if (needed.role === 'soldier') {
                  return true;
                }
                // Otherwise, check if soldier has the required role
                return s.roles.includes(needed.role);
              })
              .filter((s) => !alreadyUsedInThisSlot.has(s.id))
              .filter((s) => soldierIsAvailableForInterval(s, start, end))
              .filter((s) => {
                return !working
                  .filter((a) => a.soldierId === s.id)
                  .some((a) => overlaps(asDate(a.startTime), asDate(a.endTime), start, end));
              })
              .filter((s) => {
                const last = getLastAssignmentBefore(working, s.id, start);
                if (!last) return true;
                return differenceInHours(start, asDate(last.endTime)) >= task.restTimeBetweenShifts;
              })
              .filter((s) => {
                if (!isNightShift(task)) return true;
                return !hasNightPreviousDay(working, s.id, day, tasksById);
              });

            if (candidates.length === 0) {
              canFulfill = false;
              break;
            }

            // Choose fairest soldier
            const chosen = candidates
              .map((s) => ({
                s,
                hours: hoursBySoldier.get(s.id) ?? 0,
                count: countBySoldier.get(s.id) ?? 0,
                tie: Math.random(),
              }))
              .sort((a, b) => a.hours - b.hours || a.count - b.count || a.tie - b.tie)[0]!.s;

            assignments.push({
              id: makeId(),
              taskId: task.id,
              soldierId: chosen.id,
              role: needed.role,
              startTime: start,
              endTime: end,
              locked: false,
            });
          }

          if (!canFulfill) break;
        }

        if (canFulfill) {
          // Add all assignments
          working = [...working, ...assignments];
          for (const assignment of assignments) {
            addToWeekStats(assignment.soldierId, task.shiftDuration);
          }
          assigned = true;
          break;
        }
      }

      if (!assigned) {
        // Count how many roles we couldn't fill
        const totalNeeded = neededRoles.reduce((sum, nr) => sum + nr.count, 0);
        unfilledSlots += totalNeeded;
      }
    }
  }

  return {
    assignments: working,
    unfilledSlots,
  };
}
