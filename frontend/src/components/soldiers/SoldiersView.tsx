import { useMemo, useState } from 'react';
import { Plus, Edit2, Trash2, Calendar, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSoldiers, useCreateSoldier, useUpdateSoldier, useDeleteSoldier } from '@/hooks/useSoldiers';
import { roleLabels, Soldier } from '@/types/scheduling';
import { SoldierForm } from './SoldierForm';
import { ConstraintForm } from './ConstraintForm';
import { usePlatoons } from '@/hooks/usePlatoons';
import { PlatoonManagementDialog } from '@/components/platoons/PlatoonManagementDialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function SoldiersView() {
  const { data: soldiers, isLoading, error, refetch } = useSoldiers();
  const { data: platoons = [] } = usePlatoons();
  const createSoldier = useCreateSoldier();
  const updateSoldier = useUpdateSoldier();
  const deleteSoldier = useDeleteSoldier();
  const [showForm, setShowForm] = useState(false);
  const [editingSoldier, setEditingSoldier] = useState<Soldier | null>(null);
  const [constraintSoldier, setConstraintSoldier] = useState<Soldier | null>(null);
  const [platoonDialog, setPlatoonDialog] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('all');

  const handleSubmit = (data: Omit<Soldier, 'id' | 'constraints'>) => {
    if (editingSoldier) {
      updateSoldier.mutate({ id: editingSoldier.id, data });
    } else {
      createSoldier.mutate(data);
    }
    setShowForm(false);
    setEditingSoldier(null);
  };

  const handleEdit = (soldier: Soldier) => {
    setEditingSoldier(soldier);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('האם אתה בטוח שברצונך למחוק חייל זה?')) {
      deleteSoldier.mutate(id);
    }
  };

  const filteredSoldiers = useMemo(() => {
    if (activeTab === 'all') return soldiers;
    if (activeTab === 'none') return soldiers?.filter((s) => !s.platoonId);
    return soldiers?.filter((s) => s.platoonId === activeTab);
  }, [soldiers, activeTab]);

  if (isLoading) {
    return <div className="p-8 text-center">טוען...</div>;
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <p className="text-destructive mb-4">שגיאה בטעינת החיילים</p>
        <Button onClick={() => refetch()}>נסה שוב</Button>
      </div>
    );
  }

  const soldiersList = soldiers ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">ניהול חיילים</h2>
          <p className="text-muted-foreground mt-1">הוסף ונהל חיילים ואילוציהם</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          הוסף חייל
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="all">
              הכל ({soldiersList.length})
            </TabsTrigger>
            {platoons.map((platoon) => (
              <TabsTrigger key={platoon.id} value={platoon.id}>
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: platoon.color }}
                  />
                  <span>{platoon.name}</span>
                  <span className="text-muted-foreground">
                    ({soldiersList.filter((s) => s.platoonId === platoon.id).length})
                  </span>
                </div>
              </TabsTrigger>
            ))}
            <TabsTrigger value="none">
              ללא מחלקה ({soldiersList.filter((s) => !s.platoonId).length})
            </TabsTrigger>
          </TabsList>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPlatoonDialog(true)}
            className="gap-2"
          >
            <Settings className="w-4 h-4" />
            נהל מחלקות
          </Button>
        </div>

        <TabsContent value={activeTab} className="mt-0">
          <div className="bg-card rounded-xl shadow-card overflow-hidden">
            <div className="overflow-x-auto" dir="rtl">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-right px-4 py-3 text-sm font-semibold text-muted-foreground">פעולות</th>
                    <th className="text-right px-4 py-3 text-sm font-semibold text-muted-foreground">שם</th>
                    <th className="text-right px-4 py-3 text-sm font-semibold text-muted-foreground">תפקידים</th>
                    <th className="text-right px-4 py-3 text-sm font-semibold text-muted-foreground">חופשה</th>
                    <th className="text-right px-4 py-3 text-sm font-semibold text-muted-foreground">אילוצים</th>
                  </tr>
                </thead>
                <tbody>
                  {(filteredSoldiers ?? []).map((soldier) => (
                    <tr key={soldier.id} className="border-t border-border hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 text-right">
                        <div className="flex gap-1 justify-start">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(soldier)}
                            className="h-8 w-8"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(soldier.id)}
                            className="h-8 w-8 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-medium">{soldier.name}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex flex-wrap gap-1 justify-start">
                          {soldier.roles.map((role) => (
                            <Badge key={role} variant="secondary" className="text-xs">
                              {roleLabels[role]}
                            </Badge>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-medium">{soldier.usedVacationDays}</span>
                        <span className="text-muted-foreground">/{soldier.maxVacationDays}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setConstraintSoldier(soldier)}
                          className="gap-1 text-muted-foreground hover:text-foreground"
                        >
                          <Calendar className="w-4 h-4" />
                          {soldier.constraints.length} אילוצים
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {(filteredSoldiers ?? []).length === 0 && (
              <div className="py-12 text-center text-muted-foreground">
                <p>אין חיילים במערכת</p>
                <Button onClick={() => setShowForm(true)} variant="link" className="mt-2">
                  הוסף חייל ראשון
                </Button>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {showForm && (
        <SoldierForm
          soldier={editingSoldier || undefined}
          onSubmit={handleSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditingSoldier(null);
          }}
        />
      )}

      {constraintSoldier && (
        <ConstraintForm
          soldier={constraintSoldier}
          onClose={() => setConstraintSoldier(null)}
        />
      )}

      <PlatoonManagementDialog
        open={platoonDialog}
        onOpenChange={setPlatoonDialog}
      />
    </div>
  );
}
