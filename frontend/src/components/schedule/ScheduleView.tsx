import { useMemo, useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft, Calendar, Lock, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { useAssignments, useCreateAssignment, useDeleteAssignment } from '@/hooks/useAssignments';
import { useSoldiers } from '@/hooks/useSoldiers';
import { useTasks } from '@/hooks/useTasks';
import { useSettings } from '@/hooks/useSettings';
import { usePlatoons } from '@/hooks/usePlatoons';
import { getRoleLabel } from '@/types/scheduling';
import { format, addDays, startOfWeek, endOfWeek, addWeeks, subWeeks } from 'date-fns';
import { he } from 'date-fns/locale';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { buildFairWeekSchedule } from '@/lib/scheduling/fairScheduling';
import { AssignDialog } from '@/components/schedule/AssignDialog';
import { PlatoonStatsCards } from '@/components/schedule/PlatoonStatsCards';
import { PlatoonFairnessChart } from '@/components/schedule/PlatoonFairnessChart';
import { PlatoonTaskDistribution } from '@/components/schedule/PlatoonTaskDistribution';

function asDate(value: unknown): Date {
  if (value instanceof Date) return value;
  if (typeof value === 'string' || typeof value === 'number') return new Date(value);
  return new Date(String(value));
}

export function ScheduleView() {
  const { data: assignments, isLoading: assignmentsLoading } = useAssignments();
  const { data: soldiers, isLoading: soldiersLoading } = useSoldiers();
  const { data: tasks, isLoading: tasksLoading } = useTasks();
  const { data: settings, isLoading: settingsLoading } = useSettings();
  const { data: platoons = [] } = usePlatoons();
  const createAssignment = useCreateAssignment();
  const deleteAssignment = useDeleteAssignment();
  const navigate = useNavigate();

  const [currentWeekStart, setCurrentWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 0 })
  );

  const [selectedPlatoonFilter, setSelectedPlatoonFilter] = useState<string[]>([]);
  const [isScheduling, setIsScheduling] = useState(false);

  const [manualDialog, setManualDialog] = useState<{
    open: boolean;
    taskId: string;
    dayKey: string;
  }>({ open: false, taskId: '', dayKey: '' });

  // Compute all derived values with fallbacks BEFORE conditional return
  const assignmentsList = assignments ?? [];
  const soldiersList = soldiers ?? [];
  const tasksList = tasks ?? [];
  const settingsData = settings ?? { minBasePresence: 75, totalSoldiers: 10 };

  const weekDays = useMemo(() =>
    Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i)),
    [currentWeekStart]
  );

  const requiredSoldiersInBase = Math.ceil((settingsData.minBasePresence / 100) * settingsData.totalSoldiers);
  const activeTasks = tasksList.filter(t => t.isActive);

  const dayKeys = useMemo(() =>
    new Set(weekDays.map((d) => format(d, 'yyyy-MM-dd'))),
    [weekDays]
  );

  const weekAssignments = useMemo(() => {
    return assignmentsList.filter((a) => dayKeys.has(format(asDate(a.startTime), 'yyyy-MM-dd')));
  }, [assignmentsList, dayKeys]);

  const soldierById = useMemo(() => new Map(soldiersList.map((s) => [s.id, s])), [soldiersList]);
  const taskById = useMemo(() => new Map(tasksList.map((t) => [t.id, t])), [tasksList]);
  const platoonById = useMemo(
    () => new Map(platoons.map((p) => [p.id, p])),
    [platoons]
  );

  const displayedAssignments = useMemo(() => {
    if (selectedPlatoonFilter.length === 0) return weekAssignments;

    return weekAssignments.filter((a) => {
      const soldier = soldierById.get(a.soldierId);
      if (!soldier) return false;

      // Check if soldier's platoon is in filter, or if "none" is selected and soldier has no platoon
      if (selectedPlatoonFilter.includes('none') && !soldier.platoonId) return true;
      if (soldier.platoonId && selectedPlatoonFilter.includes(soldier.platoonId)) return true;

      return false;
    });
  }, [weekAssignments, selectedPlatoonFilter, soldierById]);

  const assignmentsByTaskDay = useMemo(() => {
    const map = new Map<string, typeof displayedAssignments>();
    for (const a of displayedAssignments) {
      const dayKey = format(asDate(a.startTime), 'yyyy-MM-dd');
      const key = `${a.taskId}__${dayKey}`;
      map.set(key, [...(map.get(key) ?? []), a]);
    }
    return map;
  }, [displayedAssignments]);

  const isLoading = assignmentsLoading || soldiersLoading || tasksLoading || settingsLoading;

  // Check if current week is within operational period
  const isWeekInOperationalPeriod = useMemo(() => {
    if (!settings?.operationalStartDate || !settings?.operationalEndDate) {
      return false;
    }

    const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 0 });
    const opStart = new Date(settings.operationalStartDate);
    const opEnd = new Date(settings.operationalEndDate);

    return currentWeekStart <= opEnd && weekEnd >= opStart;
  }, [currentWeekStart, settings]);

  // Check if can navigate to previous week
  const canNavigatePrevious = useMemo(() => {
    if (!settings?.operationalStartDate) return false;
    const previousWeek = subWeeks(currentWeekStart, 1);
    const opStart = new Date(settings.operationalStartDate);
    return endOfWeek(previousWeek, { weekStartsOn: 0 }) >= opStart;
  }, [currentWeekStart, settings]);

  // Check if can navigate to next week
  const canNavigateNext = useMemo(() => {
    if (!settings?.operationalEndDate) return false;
    const nextWeek = addWeeks(currentWeekStart, 1);
    const opEnd = new Date(settings.operationalEndDate);
    return startOfWeek(nextWeek, { weekStartsOn: 0 }) <= opEnd;
  }, [currentWeekStart, settings]);

  // Ensure current week is within operational period when settings load
  useEffect(() => {
    if (!settings?.operationalStartDate || !settings?.operationalEndDate) {
      return;
    }

    const opStart = new Date(settings.operationalStartDate);
    const opEnd = new Date(settings.operationalEndDate);
    const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 0 });

    // If current week is before operational period, jump to first week
    if (weekEnd < opStart) {
      setCurrentWeekStart(startOfWeek(opStart, { weekStartsOn: 0 }));
      return;
    }

    // If current week is after operational period, jump to last week
    if (currentWeekStart > opEnd) {
      setCurrentWeekStart(startOfWeek(opEnd, { weekStartsOn: 0 }));
      return;
    }

    // If current week overlaps but starts before, jump to first week
    if (currentWeekStart < opStart) {
      setCurrentWeekStart(startOfWeek(opStart, { weekStartsOn: 0 }));
    }
  }, [settings?.operationalStartDate, settings?.operationalEndDate]);

  // Navigation functions
  const goToPreviousWeek = () => {
    setCurrentWeekStart(prev => addDays(prev, -7));
  };

  const goToNextWeek = () => {
    setCurrentWeekStart(prev => addDays(prev, 7));
  };

  const goToToday = () => {
    const today = new Date();
    const todayWeekStart = startOfWeek(today, { weekStartsOn: 0 });

    // If no operational period set, just go to today
    if (!settings?.operationalStartDate || !settings?.operationalEndDate) {
      setCurrentWeekStart(todayWeekStart);
      return;
    }

    const opStart = new Date(settings.operationalStartDate);
    const opEnd = new Date(settings.operationalEndDate);

    // If today is before operational period, go to first week
    if (today < opStart) {
      setCurrentWeekStart(startOfWeek(opStart, { weekStartsOn: 0 }));
      return;
    }

    // If today is after operational period, go to last week
    if (today > opEnd) {
      setCurrentWeekStart(startOfWeek(opEnd, { weekStartsOn: 0 }));
      return;
    }

    // Today is within operational period
    setCurrentWeekStart(todayWeekStart);
  };

  if (isLoading) {
    return <div className="p-8 text-center">טוען...</div>;
  }

  // Show prompt if operational period is not set
  if (!settings?.operationalStartDate || !settings?.operationalEndDate) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">לא הוגדרה תקופת תעסוקה מבצעית</h3>
          <p className="text-muted-foreground mb-4">
            יש להגדיר תקופת תעסוקה בהגדרות לפני תחילת השיבוץ
          </p>
          <Button onClick={() => navigate('/settings')}>
            עבור להגדרות
          </Button>
        </div>
      </div>
    );
  }

  const runAutoScheduling = async () => {
    if (isScheduling) {
      toast({
        title: 'שיבוץ כבר רץ',
        description: 'אנא המתן לסיום השיבוץ הנוכחי',
        variant: 'destructive',
      });
      return;
    }

    setIsScheduling(true);

    try {
      const { assignments: next, unfilledSlots } = buildFairWeekSchedule({
        weekStart: currentWeekStart,
        soldiers: soldiersList,
        tasks: tasksList,
        platoons: platoons,
        existingAssignments: assignmentsList,
      });

      // Delete old assignments for the week and create new ones
      const weekStart = format(currentWeekStart, 'yyyy-MM-dd');
      const weekEnd = format(addDays(currentWeekStart, 7), 'yyyy-MM-dd');

      // Find assignments to delete (those in the current week)
      const toDelete = assignmentsList.filter((a) => {
        const dayKey = format(asDate(a.startTime), 'yyyy-MM-dd');
        return dayKey >= weekStart && dayKey < weekEnd;
      });

      // Delete old assignments (non-locked ones only) - sequentially to avoid conflicts
      for (const assignment of toDelete) {
        if (!assignment.locked) {
          await deleteAssignment.mutateAsync(assignment.id);
        }
      }

      // Create new assignments (only for current week, non-locked) - sequentially
      const toCreate = next.filter((a) => {
        const dayKey = format(asDate(a.startTime), 'yyyy-MM-dd');
        const isInCurrentWeek = dayKey >= weekStart && dayKey < weekEnd;
        return isInCurrentWeek && !a.locked;
      });

      for (const assignment of toCreate) {
        await createAssignment.mutateAsync({
          taskId: assignment.taskId,
          soldierId: assignment.soldierId,
          role: assignment.role,
          startTime: assignment.startTime,
          endTime: assignment.endTime,
          locked: assignment.locked,
        });
      }

      toast({
        title: 'שיבוץ אוטומטי הושלם',
        description:
          unfilledSlots > 0
            ? `לא הצלחתי לאייש ${unfilledSlots} תפקידים השבוע (בדוק אילוצים/כוח אדם).`
            : 'כל התפקידים אוישו בהתאם לכללי ההוגנות.',
      });
    } catch (error) {
      toast({
        title: 'שגיאה בשיבוץ',
        description: 'אירעה שגיאה בעת ביצוע השיבוץ האוטומטי',
        variant: 'destructive',
      });
      console.error('Auto-scheduling error:', error);
    } finally {
      setIsScheduling(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">לוח שיבוצים</h2>
          <p className="text-muted-foreground mt-1">תצוגת שבוע ושיבוץ משימות</p>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={selectedPlatoonFilter[0] || 'all'}
            onValueChange={(v) => {
              if (v === 'all') {
                setSelectedPlatoonFilter([]);
              } else {
                setSelectedPlatoonFilter([v]);
              }
            }}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="סנן לפי מחלקה" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">כל המחלקות</SelectItem>
              {platoons.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: p.color }}
                    />
                    <span>{p.name}</span>
                  </div>
                </SelectItem>
              ))}
              <SelectItem value="none">ללא מחלקה</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="default"
            size="sm"
            onClick={runAutoScheduling}
            disabled={isScheduling}
            className="gap-2"
          >
            <Sparkles className="w-4 h-4" />
            {isScheduling ? 'משבץ...' : 'שיבוץ אוטומטי'}
          </Button>
          <Button variant="outline" size="sm" onClick={goToToday}>
            היום
          </Button>
          <Button variant="outline" size="icon" onClick={goToPreviousWeek} disabled={!canNavigatePrevious}>
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={goToNextWeek} disabled={!canNavigateNext}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="bg-card rounded-xl shadow-card overflow-hidden">
        <div className="grid grid-cols-8 border-b border-border">
          <div className="p-4 bg-muted/50 font-semibold text-sm text-muted-foreground">
            משימה
          </div>
          {weekDays.map((day, idx) => (
            <div
              key={idx}
              className={`p-4 text-center border-r border-border ${
                format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
                  ? 'bg-primary/5'
                  : 'bg-muted/50'
              }`}
            >
              <p className="text-xs text-muted-foreground">
                {format(day, 'EEEE', { locale: he })}
              </p>
              <p className="font-semibold">{format(day, 'd/M')}</p>
            </div>
          ))}
        </div>

        {activeTasks.map((task) => (
          <div key={task.id} className="grid grid-cols-8 border-b border-border last:border-0">
            <div className="p-4 bg-muted/30">
              <p className="font-medium text-sm">{task.name}</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {task.requiredRoles.map((role, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs">
                    {role.count} {getRoleLabel(role.role)}
                  </Badge>
                ))}
              </div>
            </div>
            {weekDays.map((day, idx) => (
              <div
                key={idx}
                className="p-2 border-r border-border min-h-[100px] hover:bg-muted/20 transition-colors cursor-pointer group"
                onClick={() => {
                  setManualDialog({ open: true, taskId: task.id, dayKey: format(day, 'yyyy-MM-dd') });
                }}
              >
                {(() => {
                  const dayKey = format(day, 'yyyy-MM-dd');
                  const slotKey = `${task.id}__${dayKey}`;
                  const slotAssignments = (assignmentsByTaskDay.get(slotKey) ?? [])
                    .slice()
                    .sort((a, b) => a.role.localeCompare(b.role));

                  if (slotAssignments.length === 0) {
                    return (
                      <div className="h-full flex items-center justify-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            setManualDialog({ open: true, taskId: task.id, dayKey });
                          }}
                        >
                          + שבץ
                        </Button>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-1">
                      {slotAssignments.map((a) => (
                        <div
                          key={a.id}
                          className="flex items-center justify-between rounded-md border border-border bg-background/50 px-2 py-1 text-xs"
                        >
                          <div className="flex items-center gap-1">
                            <span className="truncate">
                              {soldierById.get(a.soldierId)?.name ?? 'חייל'} · {getRoleLabel(a.role)}
                            </span>
                            {(() => {
                              const soldier = soldierById.get(a.soldierId);
                              const platoon = soldier?.platoonId ? platoonById.get(soldier.platoonId) : null;
                              if (platoon) {
                                return (
                                  <div
                                    className="w-2 h-2 rounded-full flex-shrink-0"
                                    style={{ backgroundColor: platoon.color }}
                                    title={platoon.name}
                                  />
                                );
                              }
                              return null;
                            })()}
                          </div>
                          {!!a.locked && <Lock className="w-3.5 h-3.5 text-muted-foreground" />}
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            ))}
          </div>
        ))}

        {activeTasks.length === 0 && (
          <div className="py-12 text-center text-muted-foreground">
            <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>אין משימות פעילות</p>
            <p className="text-sm">הוסף משימות בעמוד המשימות</p>
          </div>
        )}
      </div>

      {platoons.length > 0 && (
        <div className="space-y-6">
          <PlatoonStatsCards
            soldiers={soldiersList}
            tasks={tasksList}
            platoons={platoons}
            weekAssignments={displayedAssignments}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PlatoonFairnessChart
              soldiers={soldiersList}
              tasks={tasksList}
              platoons={platoons}
              weekAssignments={displayedAssignments}
            />

            <PlatoonTaskDistribution
              soldiers={soldiersList}
              tasks={tasksList}
              platoons={platoons}
              weekAssignments={displayedAssignments}
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl p-5 shadow-card">
          <h3 className="font-semibold mb-3">סטטיסטיקות שבועיות</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">משימות פעילות</span>
              <span className="font-medium">{activeTasks.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">חיילים זמינים</span>
              <span className="font-medium">{soldiersList.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">נדרשים במוצב</span>
              <span className="font-medium">{requiredSoldiersInBase}</span>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl p-5 shadow-card">
          <h3 className="font-semibold mb-3">התפלגות לפי מחלקות</h3>
          <div className="space-y-2">
            {platoons.map((platoon) => {
              const count = displayedAssignments.filter((a) => {
                const soldier = soldierById.get(a.soldierId);
                return soldier?.platoonId === platoon.id;
              }).length;

              return (
                <div key={platoon.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: platoon.color }}
                    />
                    <span>{platoon.name}</span>
                  </div>
                  <span className="font-medium">{count} שיבוצים</span>
                </div>
              );
            })}
            {(() => {
              const noneCount = displayedAssignments.filter((a) => {
                const soldier = soldierById.get(a.soldierId);
                return !soldier?.platoonId;
              }).length;
              if (noneCount > 0) {
                return (
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-muted" />
                      <span>ללא מחלקה</span>
                    </div>
                    <span className="font-medium">{noneCount} שיבוצים</span>
                  </div>
                );
              }
              return null;
            })()}
          </div>
        </div>

        <div className="bg-card rounded-xl p-5 shadow-card">
          <h3 className="font-semibold mb-3">חיילים עם אילוצים השבוע</h3>
          <div className="space-y-2">
            {soldiers
              .filter(s => s.constraints.length > 0)
              .slice(0, 4)
              .map(soldier => (
                <div key={soldier.id} className="flex items-center justify-between text-sm">
                  <span>{soldier.name}</span>
                  <Badge variant="secondary">{soldier.constraints.length} אילוצים</Badge>
                </div>
              ))}
            {soldiersList.filter(s => s.constraints.length > 0).length === 0 && (
              <p className="text-sm text-muted-foreground">אין אילוצים פעילים</p>
            )}
          </div>
        </div>

        <div className="bg-card rounded-xl p-5 shadow-card">
          <h3 className="font-semibold mb-3">סיכום חופשות</h3>
          <div className="space-y-2">
            {soldiersList.slice(0, 4).map(soldier => (
              <div key={soldier.id} className="flex items-center justify-between text-sm">
                <span>{soldier.name}</span>
                <span className="font-medium">
                  {soldier.usedVacationDays}/{soldier.maxVacationDays}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {manualDialog.open && taskById.get(manualDialog.taskId) && (
        <AssignDialog
          open={manualDialog.open}
          onOpenChange={(open) => setManualDialog((prev) => ({ ...prev, open }))}
          task={taskById.get(manualDialog.taskId)!}
          soldiers={soldiersList}
          existingAssignments={assignmentsByTaskDay.get(`${manualDialog.taskId}__${manualDialog.dayKey}`) ?? []}
          defaultLocked={true}
          onSave={({ slots, locked }) => {
            const task = taskById.get(manualDialog.taskId)!;
            const day = new Date(`${manualDialog.dayKey}T00:00:00`);
            const start = new Date(day);
            start.setHours(task.shiftStartHour, 0, 0, 0);
            const end = new Date(start);
            end.setHours(end.getHours() + task.shiftDuration);

            // Delete old assignments for this task and day
            const toDelete = assignmentsList.filter((a) => {
              if (a.taskId !== manualDialog.taskId) return false;
              return format(asDate(a.startTime), 'yyyy-MM-dd') === manualDialog.dayKey;
            });

            for (const assignment of toDelete) {
              deleteAssignment.mutate(assignment.id);
            }

            // Create new assignments
            const used = new Set<string>();
            const toCreate = slots
              .filter((s) => !!s.soldierId)
              .filter((s) => {
                if (!s.soldierId) return false;
                if (used.has(`${s.role}__${s.soldierId}`)) return false;
                used.add(`${s.role}__${s.soldierId}`);
                return true;
              });

            for (const slot of toCreate) {
              createAssignment.mutate({
                taskId: manualDialog.taskId,
                soldierId: slot.soldierId!,
                role: slot.role,
                startTime: start,
                endTime: end,
                locked,
              });
            }

            setManualDialog({ open: false, taskId: '', dayKey: '' });
          }}
        />
      )}
    </div>
  );
}
