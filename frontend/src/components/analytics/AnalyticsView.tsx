import { useState, useMemo } from 'react';
import { format, startOfDay, endOfDay } from 'date-fns';
import { BarChart3 } from 'lucide-react';
import { useAssignments } from '@/hooks/useAssignments';
import { useSoldiers } from '@/hooks/useSoldiers';
import { useTasks } from '@/hooks/useTasks';
import { usePlatoons } from '@/hooks/usePlatoons';
import { useSettings } from '@/hooks/useSettings';
import { DateRangePicker } from './DateRangePicker';
import { PlatoonHoursChart } from './PlatoonHoursChart';
import { PlatoonHoursTable } from './PlatoonHoursTable';
import type { Assignment, Task } from '@/types/scheduling';

export interface PlatoonAnalytics {
  platoonId: string;
  platoonName: string;
  platoonColor: string;
  soldierCount: number;
  morning: number;
  afternoon: number;
  night: number;
  total: number;
  avgPerSoldier: number;
}

type ShiftType = 'morning' | 'afternoon' | 'night';

function getShiftType(task: Task): ShiftType {
  const hour = task.shiftStartHour;
  if (hour >= 22 || hour < 6) return 'night';
  if (hour >= 14) return 'afternoon';
  return 'morning';
}

function asDate(value: unknown): Date {
  if (value instanceof Date) return value;
  if (typeof value === 'string' || typeof value === 'number') return new Date(value);
  return new Date(String(value));
}

export function AnalyticsView() {
  const { data: assignments = [], isLoading: loadingAssignments } = useAssignments();
  const { data: soldiers = [], isLoading: loadingSoldiers } = useSoldiers();
  const { data: tasks = [], isLoading: loadingTasks } = useTasks();
  const { data: platoons = [], isLoading: loadingPlatoons } = usePlatoons();
  const { data: settings, isLoading: loadingSettings } = useSettings();

  // Default date range: operational period start to today
  const defaultStartDate = settings?.operationalStartDate
    ? new Date(settings.operationalStartDate)
    : new Date();
  const defaultEndDate = new Date();

  const [startDate, setStartDate] = useState<Date>(defaultStartDate);
  const [endDate, setEndDate] = useState<Date>(defaultEndDate);

  // Update defaults when settings load
  useMemo(() => {
    if (settings?.operationalStartDate) {
      setStartDate(new Date(settings.operationalStartDate));
    }
  }, [settings?.operationalStartDate]);

  const isLoading = loadingAssignments || loadingSoldiers || loadingTasks || loadingPlatoons || loadingSettings;

  const analytics = useMemo((): PlatoonAnalytics[] => {
    if (isLoading) return [];

    const tasksById = new Map(tasks.map(t => [t.id, t]));
    const soldiersById = new Map(soldiers.map(s => [s.id, s]));

    // Initialize stats for each platoon
    const stats = new Map<string, {
      morning: number;
      afternoon: number;
      night: number;
      soldierIds: Set<string>;
    }>();

    for (const platoon of platoons) {
      stats.set(platoon.id, {
        morning: 0,
        afternoon: 0,
        night: 0,
        soldierIds: new Set(),
      });
    }

    // Count soldiers per platoon
    for (const soldier of soldiers) {
      if (soldier.platoonId) {
        const stat = stats.get(soldier.platoonId);
        if (stat) {
          stat.soldierIds.add(soldier.id);
        }
      }
    }

    // Filter assignments by date range and aggregate hours
    const rangeStart = startOfDay(startDate);
    const rangeEnd = endOfDay(endDate);

    for (const assignment of assignments) {
      const assignmentStart = asDate(assignment.startTime);

      // Check if assignment is within date range
      if (assignmentStart < rangeStart || assignmentStart > rangeEnd) {
        continue;
      }

      const soldier = soldiersById.get(assignment.soldierId);
      if (!soldier?.platoonId) continue;

      const task = tasksById.get(assignment.taskId);
      if (!task) continue;

      const stat = stats.get(soldier.platoonId);
      if (!stat) continue;

      const shiftType = getShiftType(task);
      const hours = task.shiftDuration;

      stat[shiftType] += hours;
    }

    // Convert to array
    return platoons.map(platoon => {
      const stat = stats.get(platoon.id)!;
      const total = stat.morning + stat.afternoon + stat.night;
      const soldierCount = stat.soldierIds.size;

      return {
        platoonId: platoon.id,
        platoonName: platoon.name,
        platoonColor: platoon.color,
        soldierCount,
        morning: stat.morning,
        afternoon: stat.afternoon,
        night: stat.night,
        total,
        avgPerSoldier: soldierCount > 0 ? total / soldierCount : 0,
      };
    });
  }, [assignments, soldiers, tasks, platoons, startDate, endDate, isLoading]);

  if (isLoading) {
    return <div className="p-8 text-center">טוען...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <BarChart3 className="w-6 h-6" />
            אנליטיקות שעות שמירה
          </h2>
          <p className="text-muted-foreground mt-1">
            סיכום שעות לפי מחלקה וסוג משמרת
          </p>
        </div>
      </div>

      <DateRangePicker
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        minDate={settings?.operationalStartDate ? new Date(settings.operationalStartDate) : undefined}
        maxDate={settings?.operationalEndDate ? new Date(settings.operationalEndDate) : undefined}
      />

      <div className="grid gap-6">
        <PlatoonHoursChart data={analytics} />
        <PlatoonHoursTable data={analytics} />
      </div>
    </div>
  );
}
