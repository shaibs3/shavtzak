import { useState } from 'react';
import { useGetSoldiersQuery } from '../../../store/api/soldiersApi';
import { ShiftAssignmentDto } from '../../../types/dtos';
import { AssignmentRole, Task } from '../../../types/entities';
import { Button } from '../../../components/ui/Button';
import { Select } from '../../../components/ui/Select';
import { Badge } from '../../../components/ui/Badge';

interface AssignmentBuilderProps {
  value: ShiftAssignmentDto[];
  onChange: (assignments: ShiftAssignmentDto[]) => void;
  error?: string;
  taskRequirements?: Task;
}

export default function AssignmentBuilder({ value, onChange, error, taskRequirements }: AssignmentBuilderProps) {
  const { data: soldiers } = useGetSoldiersQuery();
  const [selectedSoldierId, setSelectedSoldierId] = useState('');
  const [selectedRole, setSelectedRole] = useState<AssignmentRole>(AssignmentRole.GENERAL);

  const handleAdd = () => {
    if (!selectedSoldierId) return;

    onChange([...value, { soldierId: selectedSoldierId, role: selectedRole }]);
    setSelectedSoldierId('');
  };

  const handleRemove = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const getSoldierName = (soldierId: string) => {
    return soldiers?.find((s) => s.id === soldierId)?.name || 'Unknown';
  };

  const getRoleColor = (role: AssignmentRole) => {
    switch (role) {
      case AssignmentRole.COMMANDER: return 'blue';
      case AssignmentRole.DRIVER: return 'green';
      case AssignmentRole.SPECIALIST: return 'purple';
      default: return 'gray';
    }
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700">
        Soldier Assignments
      </label>

      <div className="flex gap-3">
        <Select
          value={selectedSoldierId}
          onChange={(e) => setSelectedSoldierId(e.target.value)}
          className="flex-1"
        >
          <option value="">Select soldier</option>
          {soldiers?.map((soldier) => (
            <option key={soldier.id} value={soldier.id}>
              {soldier.name} ({soldier.rank})
            </option>
          ))}
        </Select>

        <Select
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value as AssignmentRole)}
        >
          <option value={AssignmentRole.COMMANDER}>Commander</option>
          <option value={AssignmentRole.DRIVER}>Driver</option>
          <option value={AssignmentRole.SPECIALIST}>Specialist</option>
          <option value={AssignmentRole.GENERAL}>General</option>
        </Select>

        <Button type="button" onClick={handleAdd}>
          Add
        </Button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="space-y-2">
        {value.map((assignment, index) => (
          <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-md">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium">{getSoldierName(assignment.soldierId)}</span>
              <Badge color={getRoleColor(assignment.role)}>
                {assignment.role}
              </Badge>
            </div>
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={() => handleRemove(index)}
            >
              Remove
            </Button>
          </div>
        ))}
      </div>

      {value.length === 0 && (
        <p className="text-sm text-gray-500 text-center py-4">
          No assignments yet. Add soldiers above.
        </p>
      )}
    </div>
  );
}
