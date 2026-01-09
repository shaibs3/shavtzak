import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createShiftSchema, ShiftFormData } from '../validation/shiftSchema';
import { useGetTasksQuery } from '../../../store/api/tasksApi';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import AssignmentBuilder from './AssignmentBuilder';
import { ShiftStatus } from '../../../types/entities';

interface ShiftFormProps {
  onSubmit: (data: ShiftFormData) => void;
  isLoading: boolean;
  onCancel: () => void;
  defaultValues?: Partial<ShiftFormData>;
}

export default function ShiftForm({ onSubmit, isLoading, onCancel, defaultValues }: ShiftFormProps) {
  const { data: tasks } = useGetTasksQuery();

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ShiftFormData>({
    resolver: zodResolver(createShiftSchema),
    defaultValues: defaultValues || {
      status: ShiftStatus.SCHEDULED,
      assignments: [],
    },
  });

  const selectedTaskId = watch('taskId');
  const selectedTask = tasks?.find((t) => t.id === selectedTaskId);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Controller
        name="taskId"
        control={control}
        render={({ field }) => (
          <Select
            label="Task"
            error={errors.taskId?.message}
            {...field}
          >
            <option value="">Select a task</option>
            {tasks?.map((task) => (
              <option key={task.id} value={task.id}>
                {task.name} ({task.type})
              </option>
            ))}
          </Select>
        )}
      />

      <div className="grid grid-cols-2 gap-4">
        <Controller
          name="startTime"
          control={control}
          render={({ field }) => (
            <Input
              type="datetime-local"
              label="Start Time"
              error={errors.startTime?.message}
              {...field}
            />
          )}
        />
        <Controller
          name="endTime"
          control={control}
          render={({ field }) => (
            <Input
              type="datetime-local"
              label="End Time"
              error={errors.endTime?.message}
              {...field}
            />
          )}
        />
      </div>

      {selectedTask && (
        <div className="bg-gray-50 p-4 rounded-md">
          <h3 className="font-medium text-sm text-gray-700 mb-2">Task Requirements:</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>Commanders: {selectedTask.commandersNeeded}</li>
            <li>Drivers: {selectedTask.driversNeeded}</li>
            <li>Specialists: {selectedTask.specialistsNeeded}</li>
            <li>General Soldiers: {selectedTask.generalSoldiersNeeded}</li>
          </ul>
        </div>
      )}

      <Controller
        name="assignments"
        control={control}
        render={({ field }) => (
          <AssignmentBuilder
            value={field.value}
            onChange={field.onChange}
            error={errors.assignments?.message}
            taskRequirements={selectedTask}
          />
        )}
      />

      <div className="flex justify-end gap-3">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isLoading}>
          Create Shift
        </Button>
      </div>
    </form>
  );
}
