import { useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Shift } from '../../../types/entities';
import { useShiftEvents } from '../hooks/useShiftEvents';
import ShiftDetailsModal from './ShiftDetailsModal';

interface ShiftCalendarProps {
  shifts: Shift[];
  isLoading: boolean;
  onDateChange: (date: Date) => void;
}

export default function ShiftCalendar({ shifts, isLoading, onDateChange }: ShiftCalendarProps) {
  const [selectedShiftId, setSelectedShiftId] = useState<string | null>(null);
  const events = useShiftEvents(shifts);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-gray-500">Loading shifts...</p>
      </div>
    );
  }

  return (
    <>
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay',
        }}
        events={events}
        eventClick={(info) => {
          setSelectedShiftId(info.event.id);
        }}
        datesSet={(dateInfo) => onDateChange(dateInfo.start)}
        height="auto"
        slotMinTime="00:00:00"
        slotMaxTime="24:00:00"
        allDaySlot={false}
        nowIndicator
        editable={false}
        selectable={false}
      />

      {selectedShiftId && (
        <ShiftDetailsModal
          shiftId={selectedShiftId}
          isOpen={!!selectedShiftId}
          onClose={() => setSelectedShiftId(null)}
        />
      )}
    </>
  );
}
