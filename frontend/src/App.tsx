import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import SchedulePage from './features/schedule/SchedulePage';
import SoldiersPage from './features/soldiers/SoldiersPage';
import TasksPage from './features/tasks/TasksPage';
import LeavePage from './features/leave/LeavePage';
import DeploymentPage from './features/deployment/DeploymentPage';
import DashboardPage from './features/dashboard/DashboardPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Navigate to="/schedule" replace />} />
          <Route path="schedule" element={<SchedulePage />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="soldiers" element={<SoldiersPage />} />
          <Route path="tasks" element={<TasksPage />} />
          <Route path="leave" element={<LeavePage />} />
          <Route path="deployment" element={<DeploymentPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
