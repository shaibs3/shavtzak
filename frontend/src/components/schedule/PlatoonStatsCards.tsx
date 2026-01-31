import { useMemo } from 'react';
import type { Assignment, Soldier, Task, Platoon } from '@/types/scheduling';

function asDate(value: unknown): Date {
  if (value instanceof Date) return value;
  if (typeof value === 'string' || typeof value === 'number') return new Date(value);
  return new Date(String(value));
}

export function PlatoonStatsCards({
  soldiers,
  tasks,
  platoons,
  weekAssignments,
}: {
  soldiers: Soldier[];
  tasks: Task[];
  platoons: Platoon[];
  weekAssignments: Assignment[];
}) {
  const tasksById = useMemo(() => new Map(tasks.map((t) => [t.id, t])), [tasks]);

  const platoonStats = useMemo(() => {
    const stats = new Map<string, { totalHours: number; assignedSoldiers: Set<string> }>();

    // Initialize stats for each platoon
    platoons.forEach((p) => {
      stats.set(p.id, { totalHours: 0, assignedSoldiers: new Set() });
    });

    // Calculate hours and assigned soldiers per platoon
    for (const assignment of weekAssignments) {
      const soldier = soldiers.find((s) => s.id === assignment.soldierId);
      if (!soldier?.platoonId) continue;

      const platoonStat = stats.get(soldier.platoonId);
      if (!platoonStat) continue;

      const task = tasksById.get(assignment.taskId);
      const hours =
        task?.shiftDuration ??
        Math.max(0, (asDate(assignment.endTime).getTime() - asDate(assignment.startTime).getTime()) / 36e5);

      platoonStat.totalHours += hours;
      platoonStat.assignedSoldiers.add(soldier.id);
    }

    return stats;
  }, [soldiers, tasks, platoons, weekAssignments, tasksById]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {platoons.map((platoon) => {
        const stat = platoonStats.get(platoon.id);
        const totalSoldiers = soldiers.filter((s) => s.platoonId === platoon.id).length;
        const assignedCount = stat?.assignedSoldiers.size ?? 0;
        const totalHours = Math.round((stat?.totalHours ?? 0) * 10) / 10;
        const avgHours = assignedCount > 0 ? Math.round((totalHours / assignedCount) * 10) / 10 : 0;
        const utilization = totalSoldiers > 0 ? Math.round((assignedCount / totalSoldiers) * 100) : 0;

        return (
          <div
            key={platoon.id}
            className="bg-card rounded-xl p-5 shadow-card border-r-4"
            style={{ borderRightColor: platoon.color }}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-lg">{platoon.name}</h3>
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: platoon.color }}
              />
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">סה״כ שעות:</span>
                <span className="font-semibold">{totalHours}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">ממוצע לחייל:</span>
                <span className="font-semibold">{avgHours} שעות</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">חיילים משובצים:</span>
                <span className="font-semibold">
                  {assignedCount}/{totalSoldiers}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">ניצול:</span>
                <span className="font-semibold">{utilization}%</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
