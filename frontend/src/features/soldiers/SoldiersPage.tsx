import { useState } from 'react';
import { useGetSoldiersQuery, useDeleteSoldierMutation } from '../../store/api/soldiersApi';
import SoldierFormModal from './components/SoldierFormModal';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Alert } from '../../components/ui/Alert';
import { Soldier } from '../../types/entities';

export default function SoldiersPage() {
  const { data: soldiers, isLoading, error } = useGetSoldiersQuery();
  const [deleteSoldier] = useDeleteSoldierMutation();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSoldier, setEditingSoldier] = useState<Soldier | undefined>();

  const handleCreate = () => {
    setEditingSoldier(undefined);
    setIsFormOpen(true);
  };

  const handleEdit = (soldier: Soldier) => {
    setEditingSoldier(soldier);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this soldier?')) {
      try {
        await deleteSoldier(id).unwrap();
      } catch (err) {
        console.error('Failed to delete soldier:', err);
      }
    }
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingSoldier(undefined);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Soldiers</h1>
        <Button onClick={handleCreate}>
          Add Soldier
        </Button>
      </div>

      {error && (
        <Alert variant="error">
          Failed to load soldiers. Please make sure the backend is running.
        </Alert>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <p className="text-gray-500">Loading soldiers...</p>
        </div>
      )}

      {!isLoading && soldiers && (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rank
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Qualifications
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vacation
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {soldiers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No soldiers found. Create your first soldier to get started.
                  </td>
                </tr>
              ) : (
                soldiers.map((soldier) => (
                  <tr key={soldier.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{soldier.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{soldier.rank}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex gap-2">
                        {soldier.isCommander && <Badge color="blue">Commander</Badge>}
                        {soldier.isDriver && <Badge color="green">Driver</Badge>}
                        {soldier.isSpecialist && <Badge color="purple">Specialist</Badge>}
                        {!soldier.isCommander && !soldier.isDriver && !soldier.isSpecialist && (
                          <span className="text-sm text-gray-500">None</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {soldier.vacationDaysUsed}/{soldier.vacationQuotaDays} days
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEdit(soldier)}
                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(soldier.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <SoldierFormModal
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        soldier={editingSoldier}
      />
    </div>
  );
}
