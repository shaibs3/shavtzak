import { useState } from 'react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { useGetShiftsQuery } from '../../store/api/shiftsApi';
import ShiftCalendar from './components/ShiftCalendar';
import CreateShiftModal from './components/CreateShiftModal';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';

export default function SchedulePage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Fetch shifts for current month
  const { data: shifts, isLoading, error } = useGetShiftsQuery({
    startDate: format(startOfMonth(currentDate), 'yyyy-MM-dd'),
    endDate: format(endOfMonth(currentDate), 'yyyy-MM-dd'),
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Schedule</h1>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          Create Shift
        </Button>
      </div>

      {error && (
        <Alert variant="error">
          Failed to load shifts. Please make sure the backend is running.
        </Alert>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <ShiftCalendar
          shifts={shifts || []}
          isLoading={isLoading}
          onDateChange={setCurrentDate}
        />
      </div>

      <CreateShiftModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
}
