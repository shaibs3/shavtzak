import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Role, roleLabels, Soldier } from '@/types/scheduling';
import { X } from 'lucide-react';

interface SoldierFormProps {
  soldier?: Soldier;
  onSubmit: (data: Omit<Soldier, 'id' | 'constraints'>) => void;
  onCancel: () => void;
}

const allRoles: Role[] = ['commander', 'driver', 'radio_operator', 'soldier'];

export function SoldierForm({ soldier, onSubmit, onCancel }: SoldierFormProps) {
  const [name, setName] = useState(soldier?.name || '');
  const [rank, setRank] = useState(soldier?.rank || '');
  const [roles, setRoles] = useState<Role[]>(soldier?.roles || ['soldier']);
  const [maxVacationDays, setMaxVacationDays] = useState(soldier?.maxVacationDays || 5);
  const [usedVacationDays, setUsedVacationDays] = useState(soldier?.usedVacationDays || 0);

  const handleRoleToggle = (role: Role) => {
    setRoles(prev =>
      prev.includes(role)
        ? prev.filter(r => r !== role)
        : [...prev, role]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !rank.trim() || roles.length === 0) return;
    
    onSubmit({
      name: name.trim(),
      rank: rank.trim(),
      roles,
      maxVacationDays,
      usedVacationDays,
    });
  };

  return (
    <div className="fixed inset-0 bg-foreground/50 flex items-center justify-center z-50">
      <div className="bg-card rounded-xl p-6 w-full max-w-md shadow-lg animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">
            {soldier ? 'עריכת חייל' : 'הוספת חייל חדש'}
          </h3>
          <button onClick={onCancel} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">שם מלא</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="הכנס שם מלא"
              className="mt-1.5"
            />
          </div>

          <div>
            <Label htmlFor="rank">דרגה</Label>
            <Input
              id="rank"
              value={rank}
              onChange={(e) => setRank(e.target.value)}
              placeholder="לדוגמה: סמל, רב״ט"
              className="mt-1.5"
            />
          </div>

          <div>
            <Label>תפקידים</Label>
            <div className="grid grid-cols-2 gap-2 mt-1.5">
              {allRoles.map((role) => (
                <label
                  key={role}
                  className="flex items-center gap-2 p-2 rounded-lg border border-border hover:bg-muted cursor-pointer"
                >
                  <Checkbox
                    checked={roles.includes(role)}
                    onCheckedChange={() => handleRoleToggle(role)}
                  />
                  <span className="text-sm">{roleLabels[role]}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="maxVacation">מקסימום ימי חופשה</Label>
              <Input
                id="maxVacation"
                type="number"
                min={0}
                value={maxVacationDays}
                onChange={(e) => setMaxVacationDays(Number(e.target.value))}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="usedVacation">ימי חופשה בשימוש</Label>
              <Input
                id="usedVacation"
                type="number"
                min={0}
                max={maxVacationDays}
                value={usedVacationDays}
                onChange={(e) => setUsedVacationDays(Number(e.target.value))}
                className="mt-1.5"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" className="flex-1">
              {soldier ? 'שמור שינויים' : 'הוסף חייל'}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              ביטול
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
