import { Users, ClipboardList, Calendar, Settings, LayoutDashboard, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/badge';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const navItems = [
  { id: 'dashboard', label: 'לוח בקרה', icon: LayoutDashboard },
  { id: 'soldiers', label: 'חיילים', icon: Users },
  { id: 'tasks', label: 'משימות', icon: ClipboardList },
  { id: 'schedule', label: 'שיבוצים', icon: Calendar },
  { id: 'settings', label: 'הגדרות', icon: Settings },
];

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const { user, logout, isAdmin } = useAuth();

  return (
    <aside className="w-64 bg-military-dark min-h-screen p-4 flex flex-col shrink-0" dir="rtl">
      <div className="mb-8 px-2">
        <div className="flex items-center gap-3">
          <img
            src="/lavi-logo.png"
            alt="Lavi Logo"
            className="w-10 h-10 rounded-lg object-contain"
          />
          <div>
            <h1 className="text-lg font-bold text-white">שבצ״ק</h1>
            <p className="text-xs text-sidebar-foreground/60">מערכת שיבוצים</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-military"
                  : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
              )}
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="mt-auto pt-4 border-t border-sidebar-border">
        {user && (
          <div className="flex items-center gap-3 px-2 py-2">
            {user.picture ? (
              <img
                src={user.picture}
                alt={user.name}
                className="w-8 h-8 rounded-full"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-sidebar-accent flex items-center justify-center">
                <span className="text-sm font-medium text-sidebar-foreground">
                  {user.name.charAt(0)}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {user.name}
              </p>
              <Badge
                variant={isAdmin ? 'default' : 'secondary'}
                className="text-xs mt-0.5"
              >
                {isAdmin ? 'מנהל' : 'צופה'}
              </Badge>
            </div>
            <button
              onClick={logout}
              className="p-1.5 rounded-lg text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
              title="התנתק"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
