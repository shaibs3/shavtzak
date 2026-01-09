import { useMemo } from 'react';
import { Shift } from '../../../types/entities';
import { getShiftColor } from '../utils/shiftColors';

export function useShiftEvents(shifts: Shift[]) {
  return useMemo(() => {
    return shifts.map((shift) => ({
      id: shift.id,
      title: shift.task?.name || 'Shift',
      start: shift.startTime,
      end: shift.endTime,
      backgroundColor: getShiftColor(shift),
      borderColor: getShiftColor(shift),
      extendedProps: {
        shift,
      },
    }));
  }, [shifts]);
}
