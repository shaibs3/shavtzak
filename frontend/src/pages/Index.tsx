import { useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Dashboard } from '@/components/dashboard/Dashboard';
import { SoldiersView } from '@/components/soldiers/SoldiersView';
import { TasksView } from '@/components/tasks/TasksView';
import { ScheduleView } from '@/components/schedule/ScheduleView';
import { SettingsView } from '@/components/settings/SettingsView';

const Index = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'soldiers':
        return <SoldiersView />;
      case 'tasks':
        return <TasksView />;
      case 'schedule':
        return <ScheduleView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex min-h-screen bg-background flex-row-reverse">
      <main className="flex-1 p-6 overflow-auto" dir="rtl">
        <div className="max-w-7xl mx-auto">
          {renderContent()}
        </div>
      </main>
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default Index;
