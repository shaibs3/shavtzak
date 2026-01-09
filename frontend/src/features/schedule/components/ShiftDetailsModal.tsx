import { useState } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Alert } from '../../../components/ui/Alert';
import ShiftInfo from './ShiftInfo';
import { useGetShiftQuery, useDeleteShiftMutation } from '../../../store/api/shiftsApi';

interface ShiftDetailsModalProps {
  shiftId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function ShiftDetailsModal({ shiftId, isOpen, onClose }: ShiftDetailsModalProps) {
  const { data: shift, isLoading, error } = useGetShiftQuery(shiftId, {
    skip: !isOpen || !shiftId,
  });
  const [deleteShift, { isLoading: isDeleting }] = useDeleteShiftMutation();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDelete = async () => {
    try {
      await deleteShift(shiftId).unwrap();
      onClose();
    } catch (err) {
      console.error('Failed to delete shift:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Shift Details" size="lg">
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <p className="text-gray-500">Loading shift details...</p>
        </div>
      )}

      {error && (
        <Alert variant="error">
          Failed to load shift details. Please try again.
        </Alert>
      )}

      {shift && (
        <>
          <ShiftInfo shift={shift} />

          {showDeleteConfirm ? (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800 mb-4">
                Are you sure you want to delete this shift? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  isLoading={isDeleting}
                  onClick={handleDelete}
                >
                  Confirm Delete
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-6 flex justify-end gap-3">
              <Button
                variant="secondary"
                onClick={onClose}
              >
                Close
              </Button>
              <Button
                variant="danger"
                onClick={() => setShowDeleteConfirm(true)}
              >
                Delete Shift
              </Button>
            </div>
          )}
        </>
      )}
    </Modal>
  );
}
