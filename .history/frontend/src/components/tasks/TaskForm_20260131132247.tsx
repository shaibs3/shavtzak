import { useState, useMemo } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Role, getRoleLabel, getAllRoles, Task, TaskRole } from '@/types/scheduling';
import { useSettings } from '@/hooks/useSettings';

interface TaskFormProps {
  task?: Task;
  onSubmit: (data: Omit<Task, 'id'>) => void;
  onCancel: () => void;
}

export function TaskForm({ task, onSubmit, onCancel }: TaskFormProps) {
  const { data: settings, isLoading: settingsLoading } = useSettings();
  const allRoles = useMemo(() => {
    if (!settings) {
      // If settings haven't loaded yet, return default roles
      return getAllRoles([]);
    }
    const customRoles = settings.customRoles;
    // Handle both null, undefined, and array cases
    let rolesArray: string[] = [];
    if (customRoles === null || customRoles === undefined) {
      rolesArray = [];
    } else if (Array.isArray(customRoles)) {
      rolesArray = customRoles;
    }
    
    return getAllRoles(rolesArray);
  }, [settings]);
  
  const [name, setName] = useState(task?.name || '');
  const [description, setDescription] = useState(task?.description || '');
  const [shiftStartHour, setShiftStartHour] = useState(task?.shiftStartHour ?? 8);
  const [shiftDuration, setShiftDuration] = useState(task?.shiftDuration || 8);
  const [restTime, setRestTime] = useState(task?.restTimeBetweenShifts || 12);
  const [isActive, setIsActive] = useState(task?.isActive ?? true);
  const [requiredRoles, setRequiredRoles] = useState<TaskRole[]>(
    task?.requiredRoles || []
  );

  const handleAddRole = () => {
    const usedRoles = requiredRoles.map(r => r.role);
    const availableRole = allRoles.find(r => !usedRoles.includes(r));
    if (availableRole) {
      setRequiredRoles([...requiredRoles, { role: availableRole, count: 1 }]);
    }
  };

  const handleRemoveRole = (index: number) => {
    setRequiredRoles(requiredRoles.filter((_, i) => i !== index));
  };

  const handleRoleChange = (index: number, role: Role) => {
    const updated = [...requiredRoles];
    updated[index] = { ...updated[index], role };
    setRequiredRoles(updated);
  };

  const handleCountChange = (index: number, count: number) => {
    const updated = [...requiredRoles];
    updated[index] = { ...updated[index], count: Math.max(1, count) };
    setRequiredRoles(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || requiredRoles.length === 0) return;

    // Remove id from requiredRoles (server doesn't accept it)
    const cleanedRoles = requiredRoles.map(({ role, count }) => ({ role, count }));

    onSubmit({
      name: name.trim(),
      description: description.trim() || undefined,
      shiftStartHour,
      shiftDuration,
      restTimeBetweenShifts: restTime,
      isActive,
      requiredRoles: cleanedRoles,
    });
  };

  return (
    <div className="fixed inset-0 bg-foreground/50 flex items-center justify-center z-50">
      <div className="bg-card rounded-xl p-6 w-full max-w-lg shadow-lg animate-fade-in max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">
            {task ? 'עריכת משימה' : 'הוספת משימה חדשה'}
          </h3>
          <button onClick={onCancel} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">שם המשימה</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="לדוגמה: שמירה בשער"
              className="mt-1.5"
            />
          </div>

          <div>
            <Label htmlFor="description">תיאור (אופציונלי)</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="תיאור קצר של המשימה"
              className="mt-1.5"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="shiftStartHour">שעת התחלה (0-23)</Label>
              <Input
                id="shiftStartHour"
                type="number"
                min={0}
                max={23}
                value={shiftStartHour}
                onChange={(e) => setShiftStartHour(Math.max(0, Math.min(23, Number(e.target.value))))}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="shiftDuration">משך משמרת (שעות)</Label>
              <Input
                id="shiftDuration"
                type="number"
                min={1}
                max={24}
                value={shiftDuration}
                onChange={(e) => setShiftDuration(Number(e.target.value))}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="restTime">זמן מנוחה (שעות)</Label>
              <Input
                id="restTime"
                type="number"
                min={0}
                max={48}
                value={restTime}
                onChange={(e) => setRestTime(Number(e.target.value))}
                className="mt-1.5"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>תפקידים נדרשים</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleAddRole}
                disabled={requiredRoles.length >= allRoles.length}
                className="gap-1"
              >
                <Plus className="w-4 h-4" />
                הוסף תפקיד
              </Button>
            </div>
            <div className="space-y-2">
              {requiredRoles.map((taskRole, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Select
                    value={taskRole.role}
                    onValueChange={(v) => handleRoleChange(index, v as Role)}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover">
                      {allRoles.map((role) => (
                        <SelectItem
                          key={role}
                          value={role}
                          disabled={
                            requiredRoles.some((r, i) => r.role === role && i !== index)
                          }
                        >
                          {getRoleLabel(role)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    min={1}
                    max={20}
                    value={taskRole.count}
                    onChange={(e) => handleCountChange(index, Number(e.target.value))}
                    className="w-20"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveRole(index)}
                    disabled={requiredRoles.length === 1}
                    className="h-10 w-10 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between py-2">
            <Label htmlFor="isActive">משימה פעילה</Label>
            <Switch
              id="isActive"
              checked={isActive}
              onCheckedChange={setIsActive}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" className="flex-1">
              {task ? 'שמור שינויים' : 'הוסף משימה'}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              ביטול
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
