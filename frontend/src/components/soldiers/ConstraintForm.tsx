import { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSchedulingStore } from '@/store/schedulingStore';
import { Soldier, Constraint } from '@/types/scheduling';
import { format } from 'date-fns';

interface ConstraintFormProps {
  soldier: Soldier;
  onClose: () => void;
}

const constraintTypes = {
  unavailable: 'לא זמין',
  vacation: 'חופשה',
  medical: 'רפואי',
  other: 'אחר',
};

export function ConstraintForm({ soldier, onClose }: ConstraintFormProps) {
  const { addConstraint, removeConstraint } = useSchedulingStore();
  const [type, setType] = useState<Constraint['type']>('unavailable');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');

  const handleAdd = () => {
    if (!startDate || !endDate) return;
    
    addConstraint(soldier.id, {
      type,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      reason: reason.trim() || undefined,
    });
    
    setStartDate('');
    setEndDate('');
    setReason('');
  };

  const handleRemove = (constraintId: string) => {
    removeConstraint(soldier.id, constraintId);
  };

  return (
    <div className="fixed inset-0 bg-foreground/50 flex items-center justify-center z-50">
      <div className="bg-card rounded-xl p-6 w-full max-w-lg shadow-lg animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold">אילוצי {soldier.name}</h3>
            <p className="text-sm text-muted-foreground">נהל יציאות ואילוצים</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>סוג אילוץ</Label>
              <Select value={type} onValueChange={(v) => setType(v as Constraint['type'])}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  {Object.entries(constraintTypes).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>סיבה (אופציונלי)</Label>
              <Input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="סיבת האילוץ"
                className="mt-1.5"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>מתאריך</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>עד תאריך</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="mt-1.5"
              />
            </div>
          </div>

          <Button onClick={handleAdd} className="w-full gap-2" disabled={!startDate || !endDate}>
            <Plus className="w-4 h-4" />
            הוסף אילוץ
          </Button>
        </div>

        <div className="border-t border-border pt-4">
          <h4 className="text-sm font-semibold mb-3">אילוצים קיימים</h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {soldier.constraints.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                אין אילוצים מוגדרים
              </p>
            ) : (
              soldier.constraints.map((constraint) => (
                <div
                  key={constraint.id}
                  className="flex items-center justify-between p-3 bg-muted rounded-lg"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {constraintTypes[constraint.type]}
                      {constraint.reason && ` - ${constraint.reason}`}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(constraint.startDate), 'dd/MM/yyyy')} - {format(new Date(constraint.endDate), 'dd/MM/yyyy')}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemove(constraint.id)}
                    className="h-8 w-8 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="mt-6">
          <Button variant="outline" onClick={onClose} className="w-full">
            סגור
          </Button>
        </div>
      </div>
    </div>
  );
}
