import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useAutoAssignPlatoons } from '@/hooks/usePlatoons';
import { toast } from '@/hooks/use-toast';

interface AutoAssignPromptProps {
  unassignedCount: number;
  platoonIds: string[];
  onClose: () => void;
}

export function AutoAssignPrompt({
  unassignedCount,
  platoonIds,
  onClose,
}: AutoAssignPromptProps) {
  const [open, setOpen] = useState(true);
  const autoAssign = useAutoAssignPlatoons();

  useEffect(() => {
    if (!open) onClose();
  }, [open, onClose]);

  const handleAutoAssign = () => {
    autoAssign.mutate(platoonIds, {
      onSuccess: (data) => {
        toast({
          title: 'חיילים חולקו בהצלחה',
          description: `${data.assignedCount} חיילים חולקו בין ${platoonIds.length} מחלקות`,
        });
        setOpen(false);
      },
      onError: () => {
        toast({
          title: 'שגיאה בחלוקת חיילים',
          variant: 'destructive',
        });
      },
    });
  };

  const handleManual = () => {
    toast({
      title: 'ניתן לשבץ ידנית',
      description: 'ניתן לשבץ חיילים למחלקות דרך עריכת החייל',
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>חלוקת חיילים למחלקות</DialogTitle>
          <DialogDescription>
            נמצאו {unassignedCount} חיילים ללא מחלקה.
            <br />
            האם לחלק אותם אוטומטית בין המחלקות?
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button variant="outline" onClick={handleManual}>
            לא, אשבץ ידנית
          </Button>
          <Button onClick={handleAutoAssign} disabled={autoAssign.isPending}>
            {autoAssign.isPending ? 'מחלק...' : 'כן, חלק אוטומטית'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
