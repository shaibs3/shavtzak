import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Alert } from '../../../components/ui/Alert';
import { Task } from '../../../types/entities';
import { CreateTaskDto } from '../../../types/dtos';
import { useCreateTaskMutation, useUpdateTaskMutation } from '../../../store/api/tasksApi';

interface TaskFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  task?: Task;
}

export default function TaskFormModal({ isOpen, onClose, task }: TaskFormModalProps) {
  const [createTask, { isLoading: isCreating, error: createError }] = useCreateTaskMutation();
  const [updateTask, { isLoading: isUpdating, error: updateError }] = useUpdateTaskMutation();

  const isEditMode = !!task;
  const isLoading = isCreating || isUpdating;
  const error = createError || updateError;

  const { control, handleSubmit, reset, formState: { errors } } = useForm<CreateTaskDto>({
    defaultValues: {
      name: '',
      type: '',
      commandersNeeded: 0,
      driversNeeded: 0,
      specialistsNeeded: 0,
      generalSoldiersNeeded: 0,
      shiftDurationHours: 8,
      isActive: true,
    },
  });

  useEffect(() => {
    if (task) {
      reset({
        name: task.name,
        type: task.type,
        commandersNeeded: task.commandersNeeded,
        driversNeeded: task.driversNeeded,
        specialistsNeeded: task.specialistsNeeded,
        generalSoldiersNeeded: task.generalSoldiersNeeded,
        shiftDurationHours: task.shiftDurationHours,
        isActive: task.isActive,
      });
    } else {
      reset({
        name: '',
        type: '',
        commandersNeeded: 0,
        driversNeeded: 0,
        specialistsNeeded: 0,
        generalSoldiersNeeded: 0,
        shiftDurationHours: 8,
        isActive: true,
      });
    }
  }, [task, reset]);

  const onSubmit = async (data: CreateTaskDto) => {
    try {
      if (isEditMode) {
        await updateTask({ id: task.id, data }).unwrap();
      } else {
        await createTask(data).unwrap();
      }
      onClose();
    } catch (err) {
      // Error handled by display below
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? 'Edit Task' : 'Create Task'}
      size="lg"
    >
      {error && (
        <Alert variant="error" className="mb-4">
          {isEditMode ? 'Failed to update task' : 'Failed to create task'}
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Controller
            name="name"
            control={control}
            rules={{ required: 'Name is required' }}
            render={({ field }) => (
              <Input
                label="Task Name"
                error={errors.name?.message}
                placeholder="Gate duty"
                {...field}
              />
            )}
          />

          <Controller
            name="type"
            control={control}
            rules={{ required: 'Type is required' }}
            render={({ field }) => (
              <Input
                label="Task Type"
                error={errors.type?.message}
                placeholder="Security"
                {...field}
              />
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Controller
            name="shiftDurationHours"
            control={control}
            render={({ field }) => (
              <Input
                type="number"
                label="Shift Duration (hours)"
                {...field}
                onChange={(e) => field.onChange(parseInt(e.target.value))}
              />
            )}
          />
        </div>

        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            Required Personnel
          </label>

          <div className="grid grid-cols-2 gap-4">
            <Controller
              name="commandersNeeded"
              control={control}
              render={({ field }) => (
                <Input
                  type="number"
                  label="Commanders"
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value))}
                />
              )}
            />

            <Controller
              name="driversNeeded"
              control={control}
              render={({ field }) => (
                <Input
                  type="number"
                  label="Drivers"
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value))}
                />
              )}
            />

            <Controller
              name="specialistsNeeded"
              control={control}
              render={({ field }) => (
                <Input
                  type="number"
                  label="Specialists"
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value))}
                />
              )}
            />

            <Controller
              name="generalSoldiersNeeded"
              control={control}
              render={({ field }) => (
                <Input
                  type="number"
                  label="General Soldiers"
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value))}
                />
              )}
            />
          </div>
        </div>

        <Controller
          name="isActive"
          control={control}
          render={({ field }) => (
            <label className="flex items-center">
              <input
                type="checkbox"
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                checked={field.value}
                onChange={field.onChange}
              />
              <span className="ml-2 text-sm text-gray-700">Active</span>
            </label>
          )}
        />

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isLoading}>
            {isEditMode ? 'Update' : 'Create'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
