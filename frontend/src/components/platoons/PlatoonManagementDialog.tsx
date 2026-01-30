import { useState, useEffect } from 'react';
import { Edit2, Trash2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Platoon } from '@/types/scheduling';
import {
  usePlatoons,
  useCreatePlatoon,
  useUpdatePlatoon,
  useDeletePlatoon,
  useBulkUpdateSoldiers,
} from '@/hooks/usePlatoons';
import { useSoldiers } from '@/hooks/useSoldiers';
import { PlatoonForm } from './PlatoonForm';
import { DeletePlatoonDialog } from './DeletePlatoonDialog';
import { AutoAssignPrompt } from './AutoAssignPrompt';
import { toast } from '@/hooks/use-toast';

interface PlatoonManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PlatoonManagementDialog({ open, onOpenChange }: PlatoonManagementDialogProps) {
  const { data: platoons = [] } = usePlatoons();
  const { data: soldiers = [] } = useSoldiers();
  const createPlatoon = useCreatePlatoon();
  const updatePlatoon = useUpdatePlatoon();
  const deletePlatoon = useDeletePlatoon();
  const bulkUpdate = useBulkUpdateSoldiers();

  const [mode, setMode] = useState<'list' | 'create' | 'edit'>('list');
  const [selectedPlatoon, setSelectedPlatoon] = useState<Platoon | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    platoon: Platoon | null;
    soldierCount: number;
  }>({ open: false, platoon: null, soldierCount: 0 });
  const [showAutoAssign, setShowAutoAssign] = useState(false);

  useEffect(() => {
    if (platoons.length > 0) {
      const unassignedCount = soldiers.filter((s) => !s.platoonId).length;
      const hasShownPrompt = localStorage.getItem('platoons-auto-assign-prompted');

      if (unassignedCount > 0 && !hasShownPrompt) {
        setShowAutoAssign(true);
        localStorage.setItem('platoons-auto-assign-prompted', 'true');
      }
    }
  }, [platoons.length, soldiers]);

  const handleCreate = (data: { name: string; commander?: string; description?: string }) => {
    createPlatoon.mutate(data, {
      onSuccess: () => {
        toast({ title: 'מחלקה נוצרה בהצלחה' });
        setMode('list');
      },
      onError: () => {
        toast({ title: 'שגיאה ביצירת מחלקה', variant: 'destructive' });
      },
    });
  };

  const handleUpdate = (data: { name: string; commander?: string; description?: string }) => {
    if (!selectedPlatoon) return;
    updatePlatoon.mutate(
      { id: selectedPlatoon.id, data },
      {
        onSuccess: () => {
          toast({ title: 'מחלקה עודכנה בהצלחה' });
          setMode('list');
          setSelectedPlatoon(null);
        },
        onError: () => {
          toast({ title: 'שגיאה בעדכון מחלקה', variant: 'destructive' });
        },
      }
    );
  };

  const handleDeleteAttempt = (platoon: Platoon) => {
    const soldierCount = platoon.soldiers?.length || 0;
    if (soldierCount > 0) {
      setDeleteDialog({ open: true, platoon, soldierCount });
    } else {
      deletePlatoon.mutate(platoon.id, {
        onSuccess: () => {
          toast({ title: 'מחלקה נמחקה בהצלחה' });
        },
        onError: () => {
          toast({ title: 'שגיאה במחיקת מחלקה', variant: 'destructive' });
        },
      });
    }
  };

  const handleDeleteConfirm = async (targetPlatoonId: string | null) => {
    if (!deleteDialog.platoon) return;

    const soldierIds = deleteDialog.platoon.soldiers?.map((s) => s.id) || [];

    // Bulk update soldiers first
    bulkUpdate.mutate(
      { soldierIds, platoonId: targetPlatoonId },
      {
        onSuccess: () => {
          // Then delete platoon
          deletePlatoon.mutate(deleteDialog.platoon!.id, {
            onSuccess: () => {
              toast({ title: 'מחלקה נמחקה והחיילים הועברו' });
              setDeleteDialog({ open: false, platoon: null, soldierCount: 0 });
            },
            onError: () => {
              toast({ title: 'שגיאה במחיקת מחלקה', variant: 'destructive' });
            },
          });
        },
        onError: () => {
          toast({ title: 'שגיאה בהעברת חיילים', variant: 'destructive' });
        },
      }
    );
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {mode === 'list' && 'ניהול מחלקות'}
              {mode === 'create' && 'יצירת מחלקה חדשה'}
              {mode === 'edit' && 'עריכת מחלקה'}
            </DialogTitle>
          </DialogHeader>

          {mode === 'list' && (
            <div className="space-y-4">
              <div className="space-y-2">
                {platoons.map((platoon) => (
                  <div
                    key={platoon.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-border bg-card"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-6 h-6 rounded-full"
                        style={{ backgroundColor: platoon.color }}
                      />
                      <div>
                        <p className="font-medium">{platoon.name}</p>
                        {platoon.commander && (
                          <p className="text-sm text-muted-foreground">{platoon.commander}</p>
                        )}
                      </div>
                      <Badge variant="secondary">
                        {platoon.soldiers?.length || 0} חיילים
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedPlatoon(platoon);
                          setMode('edit');
                        }}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteAttempt(platoon)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <Button onClick={() => setMode('create')} className="w-full gap-2">
                <Plus className="w-4 h-4" />
                הוסף מחלקה
              </Button>
            </div>
          )}

          {mode === 'create' && (
            <PlatoonForm
              onSubmit={handleCreate}
              onCancel={() => setMode('list')}
              isSubmitting={createPlatoon.isPending}
            />
          )}

          {mode === 'edit' && selectedPlatoon && (
            <PlatoonForm
              platoon={selectedPlatoon}
              onSubmit={handleUpdate}
              onCancel={() => {
                setMode('list');
                setSelectedPlatoon(null);
              }}
              isSubmitting={updatePlatoon.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      {deleteDialog.platoon && (
        <DeletePlatoonDialog
          open={deleteDialog.open}
          onOpenChange={(open) =>
            setDeleteDialog({ open, platoon: deleteDialog.platoon, soldierCount: deleteDialog.soldierCount })
          }
          platoon={deleteDialog.platoon}
          soldierCount={deleteDialog.soldierCount}
          availablePlatoons={platoons.filter((p) => p.id !== deleteDialog.platoon?.id)}
          onConfirm={handleDeleteConfirm}
          isDeleting={bulkUpdate.isPending || deletePlatoon.isPending}
        />
      )}

      {showAutoAssign && (
        <AutoAssignPrompt
          unassignedCount={soldiers.filter((s) => !s.platoonId).length}
          platoonIds={platoons.map((p) => p.id)}
          onClose={() => setShowAutoAssign(false)}
        />
      )}
    </>
  );
}
