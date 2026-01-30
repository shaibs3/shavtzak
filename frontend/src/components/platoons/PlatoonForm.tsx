import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Platoon } from '@/types/scheduling';

interface PlatoonFormProps {
  platoon?: Platoon;
  onSubmit: (data: { name: string; commander?: string; description?: string }) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

export function PlatoonForm({ platoon, onSubmit, onCancel, isSubmitting }: PlatoonFormProps) {
  const [name, setName] = useState(platoon?.name || '');
  const [commander, setCommander] = useState(platoon?.commander || '');
  const [description, setDescription] = useState(platoon?.description || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name,
      commander: commander || undefined,
      description: description || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">שם המחלקה *</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          maxLength={100}
          className="mt-1.5"
        />
      </div>

      <div>
        <Label htmlFor="commander">מפקד</Label>
        <Input
          id="commander"
          value={commander}
          onChange={(e) => setCommander(e.target.value)}
          maxLength={100}
          className="mt-1.5"
        />
      </div>

      <div>
        <Label htmlFor="description">תיאור</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="mt-1.5"
        />
      </div>

      {platoon && (
        <div className="bg-muted/50 rounded-lg p-3">
          <Label className="text-xs text-muted-foreground">צבע</Label>
          <div className="flex items-center gap-2 mt-1">
            <div
              className="w-6 h-6 rounded-full"
              style={{ backgroundColor: platoon.color }}
            />
            <span className="text-sm">{platoon.color}</span>
            <span className="text-xs text-muted-foreground">(מוקצה אוטומטית)</span>
          </div>
        </div>
      )}

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          ביטול
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'שומר...' : platoon ? 'עדכן' : 'צור מחלקה'}
        </Button>
      </div>
    </form>
  );
}
