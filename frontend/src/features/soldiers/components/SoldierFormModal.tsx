import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Alert } from '../../../components/ui/Alert';
import { Soldier } from '../../../types/entities';
import { CreateSoldierDto } from '../../../types/dtos';
import { useCreateSoldierMutation, useUpdateSoldierMutation } from '../../../store/api/soldiersApi';

interface SoldierFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  soldier?: Soldier;
}

export default function SoldierFormModal({ isOpen, onClose, soldier }: SoldierFormModalProps) {
  const [createSoldier, { isLoading: isCreating, error: createError }] = useCreateSoldierMutation();
  const [updateSoldier, { isLoading: isUpdating, error: updateError }] = useUpdateSoldierMutation();

  const isEditMode = !!soldier;
  const isLoading = isCreating || isUpdating;
  const error = createError || updateError;

  const { control, handleSubmit, reset, formState: { errors } } = useForm<CreateSoldierDto>({
    defaultValues: {
      name: '',
      rank: '',
      isCommander: false,
      isDriver: false,
      isSpecialist: false,
      vacationQuotaDays: 20,
    },
  });

  useEffect(() => {
    if (soldier) {
      reset({
        name: soldier.name,
        rank: soldier.rank,
        isCommander: soldier.isCommander,
        isDriver: soldier.isDriver,
        isSpecialist: soldier.isSpecialist,
        vacationQuotaDays: soldier.vacationQuotaDays,
      });
    } else {
      reset({
        name: '',
        rank: '',
        isCommander: false,
        isDriver: false,
        isSpecialist: false,
        vacationQuotaDays: 20,
      });
    }
  }, [soldier, reset]);

  const onSubmit = async (data: CreateSoldierDto) => {
    try {
      if (isEditMode) {
        await updateSoldier({ id: soldier.id, data }).unwrap();
      } else {
        await createSoldier(data).unwrap();
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
      title={isEditMode ? 'Edit Soldier' : 'Create Soldier'}
      size="md"
    >
      {error && (
        <Alert variant="error" className="mb-4">
          {isEditMode ? 'Failed to update soldier' : 'Failed to create soldier'}
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Controller
          name="name"
          control={control}
          rules={{ required: 'Name is required' }}
          render={({ field }) => (
            <Input
              label="Full Name"
              error={errors.name?.message}
              placeholder="John Doe"
              {...field}
            />
          )}
        />

        <Controller
          name="rank"
          control={control}
          rules={{ required: 'Rank is required' }}
          render={({ field }) => (
            <Input
              label="Rank"
              error={errors.rank?.message}
              placeholder="Sergeant"
              {...field}
            />
          )}
        />

        <Controller
          name="vacationQuotaDays"
          control={control}
          render={({ field }) => (
            <Input
              type="number"
              label="Vacation Quota (days)"
              {...field}
              onChange={(e) => field.onChange(parseInt(e.target.value))}
            />
          )}
        />

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Qualifications
          </label>
          <div className="space-y-2">
            <Controller
              name="isCommander"
              control={control}
              render={({ field }) => (
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    checked={field.value}
                    onChange={field.onChange}
                  />
                  <span className="ml-2 text-sm text-gray-700">Can serve as Commander</span>
                </label>
              )}
            />
            <Controller
              name="isDriver"
              control={control}
              render={({ field }) => (
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    checked={field.value}
                    onChange={field.onChange}
                  />
                  <span className="ml-2 text-sm text-gray-700">Can serve as Driver</span>
                </label>
              )}
            />
            <Controller
              name="isSpecialist"
              control={control}
              render={({ field }) => (
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    checked={field.value}
                    onChange={field.onChange}
                  />
                  <span className="ml-2 text-sm text-gray-700">Can serve as Specialist</span>
                </label>
              )}
            />
          </div>
        </div>

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
