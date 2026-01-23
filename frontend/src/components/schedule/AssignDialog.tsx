import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import type { Assignment, Role, Soldier, Task } from '@/types/scheduling';
import { roleLabels } from '@/types/scheduling';

type Slot = { role: Role; soldierId: string | null };

function buildSlots(task: Task, existing: Assignment[]): Slot[] {
  const byRole = existing.reduce<Record<string, string[]>>((acc, a) => {
    acc[a.role] = acc[a.role] ?? [];
    acc[a.role].push(a.soldierId);
    return acc;
  }, {});

  const slots: Slot[] = [];
  for (const req of task.requiredRoles) {
    const pre = byRole[req.role] ?? [];
    for (let i = 0; i < req.count; i++) {
      slots.push({ role: req.role, soldierId: pre[i] ?? null });
    }
  }
  return slots;
}

export function AssignDialog({
  open,
  onOpenChange,
  task,
  soldiers,
  existingAssignments,
  defaultLocked = true,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task;
  soldiers: Soldier[];
  existingAssignments: Assignment[];
  defaultLocked?: boolean;
  onSave: (payload: { slots: Slot[]; locked: boolean }) => void;
}) {
  const soldierById = useMemo(() => new Map(soldiers.map((s) => [s.id, s])), [soldiers]);

  const [locked, setLocked] = useState(defaultLocked);
  const [slots, setSlots] = useState<Slot[]>(() => buildSlots(task, existingAssignments));

  useEffect(() => {
    setLocked(defaultLocked);
    setSlots(buildSlots(task, existingAssignments));
  }, [defaultLocked, existingAssignments, task]);

  const candidatesByRole = useMemo(() => {
    const map = new Map<Role, Soldier[]>();
    for (const r of ['commander', 'driver', 'radio_operator', 'soldier'] as Role[]) {
      map.set(r, soldiers.filter((s) => s.roles.includes(r)));
    }
    return map;
  }, [soldiers]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl" dir="rtl">
        <DialogHeader>
          <DialogTitle>שיבוץ ידני: {task.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-border bg-muted/20 px-3 py-2">
            <div>
              <Label className="font-medium">נעילה</Label>
              <p className="text-xs text-muted-foreground">שיבוצים נעולים לא ישתנו בשיבוץ האוטומטי</p>
            </div>
            <Switch checked={locked} onCheckedChange={setLocked} />
          </div>

          <div className="space-y-3">
            {slots.map((slot, idx) => (
              <div key={idx} className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                <div className="text-sm font-medium">{roleLabels[slot.role]}</div>
                <div className="sm:col-span-2">
                  <Select
                    value={slot.soldierId ?? ''}
                    onValueChange={(value) => {
                      setSlots((prev) => prev.map((s, i) => (i === idx ? { ...s, soldierId: value || null } : s)));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="בחר חייל" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover">
                      {(candidatesByRole.get(slot.role) ?? []).map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {slot.soldierId && !soldierById.get(slot.soldierId) && (
                    <p className="text-xs text-muted-foreground mt-1">חייל לא נמצא (יתכן שנמחק)</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            onClick={() => {
              onSave({ slots, locked });
            }}
          >
            שמור שיבוץ
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            ביטול
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
