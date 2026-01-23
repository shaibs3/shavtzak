import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import type { Assignment, Soldier, Task } from '@/types/scheduling';

function asDate(value: unknown): Date {
  if (value instanceof Date) return value;
  if (typeof value === 'string' || typeof value === 'number') return new Date(value);
  return new Date(String(value));
}

export function FairnessHistogram({
  soldiers,
  tasks,
  weekAssignments,
}: {
  soldiers: Soldier[];
  tasks: Task[];
  weekAssignments: Assignment[];
}) {
  const tasksById = useMemo(() => new Map(tasks.map((t) => [t.id, t])), [tasks]);

  const data = useMemo(() => {
    const hoursBySoldier = new Map<string, number>();
    const shiftsBySoldier = new Map<string, number>();

    for (const a of weekAssignments) {
      const task = tasksById.get(a.taskId);
      const hours = task?.shiftDuration ?? Math.max(0, (asDate(a.endTime).getTime() - asDate(a.startTime).getTime()) / 36e5);
      hoursBySoldier.set(a.soldierId, (hoursBySoldier.get(a.soldierId) ?? 0) + hours);
      shiftsBySoldier.set(a.soldierId, (shiftsBySoldier.get(a.soldierId) ?? 0) + 1);
    }

    return soldiers.map((s) => ({
      soldierId: s.id,
      name: s.name,
      hours: Math.round((hoursBySoldier.get(s.id) ?? 0) * 10) / 10,
      shifts: shiftsBySoldier.get(s.id) ?? 0,
    }));
  }, [soldiers, tasksById, weekAssignments]);

  return (
    <div className="bg-card rounded-xl p-5 shadow-card">
      <div className="mb-3">
        <h3 className="font-semibold">הוגנות: חלוקת שעות לשבוע</h3>
        <p className="text-sm text-muted-foreground">מציג סה״כ שעות משובצות לכל חייל (כולל דריסות נעולות)</p>
      </div>

      <ChartContainer
        id="fairness-hours"
        className="h-[280px] w-full"
        config={{
          hours: { label: 'שעות', color: 'hsl(var(--primary))' },
        }}
      >
        <BarChart data={data} margin={{ top: 10, left: 0, right: 10, bottom: 10 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="name" tickLine={false} axisLine={false} interval={0} angle={-15} height={60} />
          <YAxis tickLine={false} axisLine={false} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Bar dataKey="hours" fill="var(--color-hours)" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ChartContainer>
    </div>
  );
}
