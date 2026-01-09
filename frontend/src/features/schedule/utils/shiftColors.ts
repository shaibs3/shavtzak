import { Shift, ShiftStatus } from '../../../types/entities';

export function getShiftColor(shift: Shift): string {
  // Color by status
  if (shift.status === ShiftStatus.COMPLETED) {
    return '#10B981'; // green
  }
  if (shift.status === ShiftStatus.IN_PROGRESS) {
    return '#F59E0B'; // amber
  }

  // Show warnings with red tint
  if (shift.warnings && shift.warnings.length > 0) {
    return '#EF4444'; // red
  }

  return '#3B82F6'; // blue (scheduled)
}
