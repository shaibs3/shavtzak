import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Platoon } from '@/types/scheduling';

interface DeletePlatoonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  platoon: Platoon;
  soldierCount: number;
  availablePlatoons: Platoon[];
  onConfirm: (targetPlatoonId: string | null) => void;
  isDeleting: boolean;
}

export function DeletePlatoonDialog({
  open,
  onOpenChange,
  platoon,
  soldierCount,
  availablePlatoons,
  onConfirm,
  isDeleting,
}: DeletePlatoonDialogProps) {
  const [selectedPlatoon, setSelectedPlatoon] = useState<string | null>(null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>מחיקת מחלקה</DialogTitle>
          <DialogDescription>
            מחלקה "{platoon.name}" כוללת {soldierCount} חיילים.
            <br />
            יש לבחור מה לעשות עם החיילים לפני המחיקה.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">העבר חיילים ל:</label>
            <Select
              value={selectedPlatoon || 'none'}
              onValueChange={(v) => setSelectedPlatoon(v === 'none' ? null : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="בחר מחלקה" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">השאר ללא מחלקה</SelectItem>
                {availablePlatoons.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: p.color }}
                      />
                      <span>{p.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            ביטול
          </Button>
          <Button
            variant="destructive"
            onClick={() => onConfirm(selectedPlatoon)}
            disabled={isDeleting}
          >
            {isDeleting ? 'מוחק...' : 'מחק מחלקה'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
