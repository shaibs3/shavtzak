import { useState } from 'react';
import { Plus, Edit2, Trash2, Clock, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useSchedulingStore } from '@/store/schedulingStore';
import { roleLabels, Task } from '@/types/scheduling';
import { TaskForm } from './TaskForm';

export function TasksView() {
  const { tasks, addTask, updateTask, deleteTask } = useSchedulingStore();
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const handleSubmit = (data: Omit<Task, 'id'>) => {
    if (editingTask) {
      updateTask(editingTask.id, data);
    } else {
      addTask(data);
    }
    setShowForm(false);
    setEditingTask(null);
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('האם אתה בטוח שברצונך למחוק משימה זו?')) {
      deleteTask(id);
    }
  };

  const handleToggleActive = (task: Task) => {
    updateTask(task.id, { isActive: !task.isActive });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">ניהול משימות</h2>
          <p className="text-muted-foreground mt-1">הגדר משימות, תפקידים ומשמרות</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          הוסף משימה
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tasks.map((task) => (
          <div
            key={task.id}
            className={`bg-card rounded-xl p-5 shadow-card transition-all ${
              !task.isActive ? 'opacity-60' : ''
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-semibold text-lg">{task.name}</h3>
                {task.description && (
                  <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                )}
              </div>
              <Switch
                checked={task.isActive}
                onCheckedChange={() => handleToggleActive(task)}
              />
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>תחילה: {String(task.shiftStartHour).padStart(2, '0')}:00</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>משמרת: {task.shiftDuration} שעות</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>מנוחה: {task.restTimeBetweenShifts} שעות</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="w-4 h-4" />
                <span>
                  סה״כ: {task.requiredRoles.reduce((acc, r) => acc + r.count, 0)} חיילים
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-1 mb-4">
              {task.requiredRoles.map((role, idx) => (
                <Badge key={idx} variant="outline" className="text-xs">
                  {role.count} {roleLabels[role.role]}
                </Badge>
              ))}
            </div>

            <div className="flex gap-2 pt-3 border-t border-border">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleEdit(task)}
                className="flex-1 gap-1"
              >
                <Edit2 className="w-4 h-4" />
                עריכה
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(task.id)}
                className="text-destructive hover:text-destructive gap-1"
              >
                <Trash2 className="w-4 h-4" />
                מחיקה
              </Button>
            </div>
          </div>
        ))}
      </div>

      {tasks.length === 0 && (
        <div className="bg-card rounded-xl py-12 text-center text-muted-foreground shadow-card">
          <p>אין משימות במערכת</p>
          <Button onClick={() => setShowForm(true)} variant="link" className="mt-2">
            הוסף משימה ראשונה
          </Button>
        </div>
      )}

      {showForm && (
        <TaskForm
          task={editingTask || undefined}
          onSubmit={handleSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditingTask(null);
          }}
        />
      )}
    </div>
  );
}
