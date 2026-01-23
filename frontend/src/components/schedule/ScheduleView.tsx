import { useMemo, useState } from 'react';
import { ChevronRight, ChevronLeft, Calendar, Lock, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSchedulingStore } from '@/store/schedulingStore';
import { roleLabels } from '@/types/scheduling';
import { format, addDays, startOfWeek } from 'date-fns';
import { he } from 'date-fns/locale';
import { toast } from '@/hooks/use-toast';
import { buildFairWeekSchedule } from '@/lib/scheduling/fairScheduling';
import { AssignDialog } from '@/components/schedule/AssignDialog';
import { FairnessHistogram } from '@/components/schedule/FairnessHistogram';

function asDate(value: unknown): Date {
  if (value instanceof Date) return value;
  if (typeof value === 'string' || typeof value === 'number') return new Date(value);
  return new Date(String(value));
}

const generateId = () => Math.random().toString(36).substring(2, 11);

export function ScheduleView() {
  const { soldiers, tasks, assignments, settings, setAssignments } = useSchedulingStore();
  const [currentWeekStart, setCurrentWeekStart] = useState(() => 
    startOfWeek(new Date(), { weekStartsOn: 0 })
  );

  const [manualDialog, setManualDialog] = useState<{
    open: boolean;
    taskId: string;
    dayKey: string;
  }>({ open: false, taskId: '', dayKey: '' });

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));

  const goToPreviousWeek = () => {
    setCurrentWeekStart(prev => addDays(prev, -7));
  };

  const goToNextWeek = () => {
    setCurrentWeekStart(prev => addDays(prev, 7));
  };

  const goToToday = () => {
    setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 0 }));
  };

  const requiredSoldiersInBase = Math.ceil((settings.minBasePresence / 100) * settings.totalSoldiers);
  const activeTasks = tasks.filter(t => t.isActive);

  const dayKeys = useMemo(() => new Set(weekDays.map((d) => format(d, 'yyyy-MM-dd'))), [weekDays]);

  const weekAssignments = useMemo(() => {
    return assignments.filter((a) => dayKeys.has(format(asDate(a.startTime), 'yyyy-MM-dd')));
  }, [assignments, dayKeys]);

  const assignmentsByTaskDay = useMemo(() => {
    const map = new Map<string, typeof weekAssignments>();
    for (const a of weekAssignments) {
      const dayKey = format(asDate(a.startTime), 'yyyy-MM-dd');
      const key = `${a.taskId}__${dayKey}`;
      map.set(key, [...(map.get(key) ?? []), a]);
    }
    return map;
  }, [weekAssignments]);

  const soldierById = useMemo(() => new Map(soldiers.map((s) => [s.id, s])), [soldiers]);
  const taskById = useMemo(() => new Map(tasks.map((t) => [t.id, t])), [tasks]);

  const runAutoScheduling = () => {
    const { assignments: next, unfilledSlots } = buildFairWeekSchedule({
      weekStart: currentWeekStart,
      soldiers,
      tasks,
      existingAssignments: assignments,
    });

    setAssignments(next);

    toast({
      title: 'שיבוץ אוטומטי הושלם',
      description:
        unfilledSlots > 0
          ? `לא הצלחתי לאייש ${unfilledSlots} תפקידים השבוע (בדוק אילוצים/כוח אדם).`
          : 'כל התפקידים אוישו בהתאם לכללי ההוגנות.',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">לוח שיבוצים</h2>
          <p className="text-muted-foreground mt-1">תצוגת שבוע ושיבוץ משימות</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="default" size="sm" onClick={runAutoScheduling} className="gap-2">
            <Sparkles className="w-4 h-4" />
            שיבוץ אוטומטי
          </Button>
          <Button variant="outline" size="sm" onClick={goToToday}>
            היום
          </Button>
          <Button variant="outline" size="icon" onClick={goToPreviousWeek}>
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={goToNextWeek}>
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
                    {role.count} {roleLabels[role.role]}
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
                          <span className="truncate">
                            {soldierById.get(a.soldierId)?.name ?? 'חייל'} · {roleLabels[a.role]}
                          </span>
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

      <FairnessHistogram soldiers={soldiers} tasks={tasks} weekAssignments={weekAssignments} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card rounded-xl p-5 shadow-card">
          <h3 className="font-semibold mb-3">סטטיסטיקות שבועיות</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">משימות פעילות</span>
              <span className="font-medium">{activeTasks.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">חיילים זמינים</span>
              <span className="font-medium">{soldiers.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">נדרשים במוצב</span>
              <span className="font-medium">{requiredSoldiersInBase}</span>
            </div>
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
            {soldiers.filter(s => s.constraints.length > 0).length === 0 && (
              <p className="text-sm text-muted-foreground">אין אילוצים פעילים</p>
            )}
          </div>
        </div>

        <div className="bg-card rounded-xl p-5 shadow-card">
          <h3 className="font-semibold mb-3">סיכום חופשות</h3>
          <div className="space-y-2">
            {soldiers.slice(0, 4).map(soldier => (
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
          soldiers={soldiers}
          existingAssignments={assignmentsByTaskDay.get(`${manualDialog.taskId}__${manualDialog.dayKey}`) ?? []}
          defaultLocked={true}
          onSave={({ slots, locked }) => {
            const task = taskById.get(manualDialog.taskId)!;
            const day = new Date(`${manualDialog.dayKey}T00:00:00`);
            const start = new Date(day);
            start.setHours(task.shiftStartHour, 0, 0, 0);
            const end = new Date(start);
            end.setHours(end.getHours() + task.shiftDuration);

            const next = assignments.filter((a) => {
              if (a.taskId !== manualDialog.taskId) return true;
              return format(asDate(a.startTime), 'yyyy-MM-dd') !== manualDialog.dayKey;
            });

            const used = new Set<string>();
            const created = slots
              .filter((s) => !!s.soldierId)
              .filter((s) => {
                if (!s.soldierId) return false;
                if (used.has(`${s.role}__${s.soldierId}`)) return false;
                used.add(`${s.role}__${s.soldierId}`);
                return true;
              })
              .map((s) => ({
                id: generateId(),
                taskId: manualDialog.taskId,
                soldierId: s.soldierId!,
                role: s.role,
                startTime: start,
                endTime: end,
                locked,
              }));

            setAssignments([...next, ...created]);
            setManualDialog({ open: false, taskId: '', dayKey: '' });
          }}
        />
      )}
    </div>
  );
}
