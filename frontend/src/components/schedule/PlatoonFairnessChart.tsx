import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import type { Assignment, Soldier, Task, Platoon } from '@/types/scheduling';

function asDate(value: unknown): Date {
  if (value instanceof Date) return value;
  if (typeof value === 'string' || typeof value === 'number') return new Date(value);
  return new Date(String(value));
}

export function PlatoonFairnessChart({
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

  const data = useMemo(() => {
    const hoursByPlatoon = new Map<string, number>();

    // Calculate total hours per platoon
    for (const assignment of weekAssignments) {
      const soldier = soldiers.find((s) => s.id === assignment.soldierId);
      if (!soldier?.platoonId) continue;

      const task = tasksById.get(assignment.taskId);
      const hours =
        task?.shiftDuration ??
        Math.max(0, (asDate(assignment.endTime).getTime() - asDate(assignment.startTime).getTime()) / 36e5);

      hoursByPlatoon.set(soldier.platoonId, (hoursByPlatoon.get(soldier.platoonId) ?? 0) + hours);
    }

    // Build chart data
    return platoons.map((platoon) => {
      const totalHours = hoursByPlatoon.get(platoon.id) ?? 0;
      const soldierCount = soldiers.filter((s) => s.platoonId === platoon.id).length;
      const avgHours = soldierCount > 0 ? totalHours / soldierCount : 0;

      return {
        name: platoon.name,
        totalHours: Math.round(totalHours * 10) / 10,
        avgHours: Math.round(avgHours * 10) / 10,
        color: platoon.color,
      };
    });
  }, [soldiers, tasks, platoons, weekAssignments, tasksById]);

  return (
    <div className="bg-card rounded-xl p-5 shadow-card">
      <div className="mb-3">
        <h3 className="font-semibold">הוגנות: חלוקת שעות לפי מחלקות</h3>
        <p className="text-sm text-muted-foreground">
          ממוצע שעות לחייל בכל מחלקה (סה״כ שעות / מספר חיילים)
        </p>
      </div>

      <ChartContainer
        id="platoon-fairness"
        className="h-[280px] w-full"
        config={{
          avgHours: { label: 'ממוצע שעות', color: 'hsl(var(--primary))' },
        }}
      >
        <BarChart data={data} margin={{ top: 10, left: 0, right: 10, bottom: 10 }}>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="name"
            tickLine={false}
            axisLine={false}
            style={{ fontSize: '14px' }}
          />
          <YAxis tickLine={false} axisLine={false} />
          <ChartTooltip
            content={<ChartTooltipContent />}
            formatter={(value: number) => [`${value} שעות`, 'ממוצע']}
          />
          <Bar
            dataKey="avgHours"
            radius={[6, 6, 0, 0]}
            fill="hsl(var(--primary))"
          />
        </BarChart>
      </ChartContainer>
    </div>
  );
}
