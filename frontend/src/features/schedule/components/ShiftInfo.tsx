import { format } from 'date-fns';
import { Shift } from '../../../types/entities';
import { Badge } from '../../../components/ui/Badge';
import { Alert } from '../../../components/ui/Alert';

interface ShiftInfoProps {
  shift: Shift;
}

export default function ShiftInfo({ shift }: ShiftInfoProps) {
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'commander': return 'blue';
      case 'driver': return 'green';
      case 'specialist': return 'purple';
      default: return 'gray';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'green';
      case 'in_progress': return 'yellow';
      default: return 'blue';
    }
  };

  return (
    <div className="space-y-6">
      {/* Warnings */}
      {shift.warnings && shift.warnings.length > 0 && (
        <Alert variant="warning">
          <div className="font-medium mb-2">Validation Warnings:</div>
          <ul className="list-disc list-inside space-y-1">
            {shift.warnings.map((warning, i) => (
              <li key={i} className="text-sm">{warning}</li>
            ))}
          </ul>
        </Alert>
      )}

      {/* Basic Info */}
      <div>
        <h3 className="text-sm font-medium text-gray-500 mb-2">Task</h3>
        <p className="text-base font-medium text-gray-900">
          {shift.task?.name || 'Unknown Task'}
        </p>
        <p className="text-sm text-gray-600">{shift.task?.type}</p>
      </div>

      {/* Time Info */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-1">Start Time</h3>
          <p className="text-sm text-gray-900">
            {format(new Date(shift.startTime), 'PPp')}
          </p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-1">End Time</h3>
          <p className="text-sm text-gray-900">
            {format(new Date(shift.endTime), 'PPp')}
          </p>
        </div>
      </div>

      {/* Status */}
      <div>
        <h3 className="text-sm font-medium text-gray-500 mb-2">Status</h3>
        <Badge color={getStatusColor(shift.status)}>
          {shift.status}
        </Badge>
      </div>

      {/* Assignments */}
      <div>
        <h3 className="text-sm font-medium text-gray-500 mb-2">
          Assigned Soldiers ({shift.assignments?.length || 0})
        </h3>
        <div className="space-y-2">
          {shift.assignments && shift.assignments.length > 0 ? (
            shift.assignments.map((assignment) => (
              <div
                key={assignment.id}
                className="flex items-center justify-between bg-gray-50 p-3 rounded-md"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium">
                    {assignment.soldier?.name || 'Unknown Soldier'}
                  </span>
                  <span className="text-sm text-gray-600">
                    ({assignment.soldier?.rank || 'Unknown'})
                  </span>
                </div>
                <Badge color={getRoleColor(assignment.role)}>
                  {assignment.role}
                </Badge>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500 text-center py-4">
              No soldiers assigned
            </p>
          )}
        </div>
      </div>

      {/* Task Requirements */}
      {shift.task && (
        <div className="bg-gray-50 p-4 rounded-md">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Task Requirements:</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>Commanders: {shift.task.commandersNeeded}</li>
            <li>Drivers: {shift.task.driversNeeded}</li>
            <li>Specialists: {shift.task.specialistsNeeded}</li>
            <li>General Soldiers: {shift.task.generalSoldiersNeeded}</li>
          </ul>
        </div>
      )}
    </div>
  );
}
