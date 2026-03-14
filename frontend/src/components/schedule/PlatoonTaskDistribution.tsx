import { useMemo } from 'react';
import type { Assignment, Soldier, Task, Platoon } from '@/types/scheduling';

export function PlatoonTaskDistribution({
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
  const distribution = useMemo(() => {
    // Create a map: platoonId -> taskId -> count
    const distMap = new Map<string, Map<string, number>>();

    // Initialize
    platoons.forEach((p) => {
      distMap.set(p.id, new Map());
      tasks.forEach((t) => {
        distMap.get(p.id)!.set(t.id, 0);
      });
    });

    // Count assignments
    for (const assignment of weekAssignments) {
      const soldier = soldiers.find((s) => s.id === assignment.soldierId);
      if (!soldier?.platoonId) continue;

      const platoonMap = distMap.get(soldier.platoonId);
      if (!platoonMap) continue;

      const count = platoonMap.get(assignment.taskId) ?? 0;
      platoonMap.set(assignment.taskId, count + 1);
    }

    return distMap;
  }, [soldiers, tasks, platoons, weekAssignments]);

  // Calculate totals
  const taskTotals = useMemo(() => {
    const totals = new Map<string, number>();
    tasks.forEach((t) => totals.set(t.id, 0));

    distribution.forEach((platoonMap) => {
      platoonMap.forEach((count, taskId) => {
        totals.set(taskId, (totals.get(taskId) ?? 0) + count);
      });
    });

    return totals;
  }, [distribution, tasks]);

  const platoonTotals = useMemo(() => {
    const totals = new Map<string, number>();

    distribution.forEach((platoonMap, platoonId) => {
      let total = 0;
      platoonMap.forEach((count) => {
        total += count;
      });
      totals.set(platoonId, total);
    });

    return totals;
  }, [distribution]);

  if (platoons.length === 0 || tasks.length === 0) {
    return null;
  }

  return (
    <div className="bg-card rounded-xl p-5 shadow-card">
      <div className="mb-3">
        <h3 className="font-semibold">התפלגות שיבוצים: מחלקות × משימות</h3>
        <p className="text-sm text-muted-foreground">
          כמות שיבוצים לכל מחלקה בכל משימה
        </p>
      </div>

      <div className="overflow-x-auto" dir="rtl">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-right px-3 py-2 font-semibold">מחלקה</th>
              {tasks.map((task) => (
                <th key={task.id} className="text-center px-3 py-2 font-semibold">
                  {task.name}
                </th>
              ))}
              <th className="text-center px-3 py-2 font-semibold">סה״כ</th>
            </tr>
          </thead>
          <tbody>
            {platoons.map((platoon) => {
              const platoonMap = distribution.get(platoon.id);
              const total = platoonTotals.get(platoon.id) ?? 0;

              return (
                <tr key={platoon.id} className="border-t border-border">
                  <td className="px-3 py-2 text-right">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: platoon.color }}
                      />
                      <span className="font-medium">{platoon.name}</span>
                    </div>
                  </td>
                  {tasks.map((task) => {
                    const count = platoonMap?.get(task.id) ?? 0;
                    const taskTotal = taskTotals.get(task.id) ?? 1;
                    const percentage = taskTotal > 0 ? Math.round((count / taskTotal) * 100) : 0;

                    return (
                      <td key={task.id} className="px-3 py-2 text-center">
                        <div className="flex flex-col items-center">
                          <span className="font-semibold">{count}</span>
                          <span className="text-xs text-muted-foreground">({percentage}%)</span>
                        </div>
                      </td>
                    );
                  })}
                  <td className="px-3 py-2 text-center font-semibold bg-muted/30">
                    {total}
                  </td>
                </tr>
              );
            })}
            <tr className="border-t-2 border-border bg-muted/50 font-semibold">
              <td className="px-3 py-2 text-right">סה״כ</td>
              {tasks.map((task) => {
                const total = taskTotals.get(task.id) ?? 0;
                return (
                  <td key={task.id} className="px-3 py-2 text-center">
                    {total}
                  </td>
                );
              })}
              <td className="px-3 py-2 text-center">
                {Array.from(taskTotals.values()).reduce((a, b) => a + b, 0)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
