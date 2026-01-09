import { Modal } from '../../../components/ui/Modal';
import ShiftForm from './ShiftForm';
import { useCreateShiftMutation } from '../../../store/api/shiftsApi';
import { CreateShiftDto } from '../../../types/dtos';
import { Alert } from '../../../components/ui/Alert';

interface CreateShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateShiftModal({ isOpen, onClose }: CreateShiftModalProps) {
  const [createShift, { isLoading, error }] = useCreateShiftMutation();

  const handleSubmit = async (data: CreateShiftDto) => {
    try {
      const result = await createShift(data).unwrap();

      // Show warnings if any
      if (result.warnings && result.warnings.length > 0) {
        // TODO: Show warning toast/notification
        console.warn('Shift created with warnings:', result.warnings);
      }

      onClose();
    } catch (err) {
      // Error handled by component display below
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Shift" size="lg">
      {error && 'data' in error && (
        <Alert variant="error" className="mb-4">
          <div className="font-medium">Validation failed:</div>
          <ul className="list-disc list-inside mt-2">
            {(error.data as any).errors?.map((err: string, i: number) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
          {(error.data as any).warnings?.length > 0 && (
            <>
              <div className="font-medium mt-3">Warnings:</div>
              <ul className="list-disc list-inside mt-2">
                {(error.data as any).warnings.map((warn: string, i: number) => (
                  <li key={i}>{warn}</li>
                ))}
              </ul>
            </>
          )}
        </Alert>
      )}

      <ShiftForm
        onSubmit={handleSubmit}
        isLoading={isLoading}
        onCancel={onClose}
      />
    </Modal>
  );
}
