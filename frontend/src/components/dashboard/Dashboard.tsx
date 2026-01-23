import { Users, ClipboardList, Calendar, AlertTriangle } from 'lucide-react';
import { StatsCard } from './StatsCard';
import { useSchedulingStore } from '@/store/schedulingStore';

export function Dashboard() {
  const { soldiers, tasks, settings } = useSchedulingStore();
  
  const activeTasks = tasks.filter(t => t.isActive).length;
  const availableSoldiers = soldiers.filter(s => s.constraints.length === 0).length;
  const requiredPresence = Math.ceil((settings.minBasePresence / 100) * settings.totalSoldiers);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">לוח בקרה</h2>
        <p className="text-muted-foreground mt-1">סקירה כללית של מערכת השיבוצים</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="סה״כ חיילים"
          value={soldiers.length}
          subtitle={`${availableSoldiers} זמינים`}
          icon={Users}
          variant="primary"
        />
        <StatsCard
          title="משימות פעילות"
          value={activeTasks}
          subtitle={`מתוך ${tasks.length} משימות`}
          icon={ClipboardList}
          variant="success"
        />
        <StatsCard
          title="נוכחות נדרשת"
          value={`${settings.minBasePresence}%`}
          subtitle={`${requiredPresence} חיילים במוצב`}
          icon={Calendar}
          variant="warning"
        />
        <StatsCard
          title="אילוצים פעילים"
          value={soldiers.reduce((acc, s) => acc + s.constraints.length, 0)}
          subtitle="יציאות ואילוצים"
          icon={AlertTriangle}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-xl p-6 shadow-card">
          <h3 className="text-lg font-semibold mb-4">חיילים אחרונים</h3>
          <div className="space-y-3">
            {soldiers.slice(0, 5).map((soldier) => (
              <div key={soldier.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-semibold text-primary">
                      {soldier.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{soldier.name}</p>
                    <p className="text-xs text-muted-foreground">{soldier.rank}</p>
                  </div>
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium">{soldier.usedVacationDays}/{soldier.maxVacationDays}</p>
                  <p className="text-xs text-muted-foreground">ימי חופשה</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card rounded-xl p-6 shadow-card">
          <h3 className="text-lg font-semibold mb-4">משימות פעילות</h3>
          <div className="space-y-3">
            {tasks.filter(t => t.isActive).map((task) => (
              <div key={task.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div>
                  <p className="font-medium text-foreground">{task.name}</p>
                  <p className="text-xs text-muted-foreground">{task.description}</p>
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium">{task.shiftDuration} שעות</p>
                  <p className="text-xs text-muted-foreground">
                    {task.requiredRoles.reduce((acc, r) => acc + r.count, 0)} חיילים
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
