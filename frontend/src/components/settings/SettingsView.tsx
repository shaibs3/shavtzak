import { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSettings, useUpdateSettings } from '@/hooks/useSettings';

export function SettingsView() {
  const { data: settings, isLoading, error, refetch } = useSettings();
  const updateSettings = useUpdateSettings();

  const [minBasePresence, setMinBasePresence] = useState(0);
  const [totalSoldiers, setTotalSoldiers] = useState(0);

  // Update local state when settings are loaded
  useEffect(() => {
    if (settings) {
      setMinBasePresence(settings.minBasePresence);
      setTotalSoldiers(settings.totalSoldiers);
    }
  }, [settings]);

  const handleSave = () => {
    updateSettings.mutate({
      minBasePresence,
      totalSoldiers,
    });
  };

  if (isLoading) {
    return <div className="p-8 text-center">טוען...</div>;
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <p className="text-destructive mb-4">שגיאה בטעינת ההגדרות</p>
        <Button onClick={() => refetch()}>נסה שוב</Button>
      </div>
    );
  }

  const requiredSoldiers = Math.ceil((minBasePresence / 100) * totalSoldiers);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">הגדרות מערכת</h2>
        <p className="text-muted-foreground mt-1">נהל הגדרות כלליות למערכת השיבוצים</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-xl p-6 shadow-card">
          <h3 className="text-lg font-semibold mb-4">הגדרות נוכחות</h3>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="totalSoldiers">סה״כ חיילים ביחידה</Label>
              <Input
                id="totalSoldiers"
                type="number"
                min={1}
                value={totalSoldiers}
                onChange={(e) => setTotalSoldiers(Number(e.target.value))}
                className="mt-1.5"
              />
              <p className="text-xs text-muted-foreground mt-1">
                מספר החיילים הכולל בתעסוקה
              </p>
            </div>

            <div>
              <Label htmlFor="minPresence">אחוז נוכחות מינימלי במוצב</Label>
              <div className="flex items-center gap-2 mt-1.5">
                <Input
                  id="minPresence"
                  type="number"
                  min={0}
                  max={100}
                  value={minBasePresence}
                  onChange={(e) => setMinBasePresence(Number(e.target.value))}
                />
                <span className="text-muted-foreground">%</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                אחוז החיילים שחייבים להישאר במוצב בכל זמן נתון
              </p>
            </div>

            <div className="pt-4 border-t border-border">
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm font-medium">חישוב נוכחות</p>
                <p className="text-2xl font-bold text-primary mt-1">
                  {requiredSoldiers} חיילים
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  נדרשים במוצב מתוך {totalSoldiers} ({minBasePresence}%)
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl p-6 shadow-card">
          <h3 className="text-lg font-semibold mb-4">הגדרות ברירת מחדל</h3>
          
          <div className="space-y-4">
            <div>
              <Label>ימי חופשה ברירת מחדל לחייל</Label>
              <Input
                type="number"
                min={0}
                defaultValue={5}
                disabled
                className="mt-1.5"
              />
              <p className="text-xs text-muted-foreground mt-1">
                ניתן לשנות בנפרד לכל חייל
              </p>
            </div>

            <div>
              <Label>זמן מנוחה ברירת מחדל (שעות)</Label>
              <Input
                type="number"
                min={0}
                defaultValue={12}
                disabled
                className="mt-1.5"
              />
              <p className="text-xs text-muted-foreground mt-1">
                ניתן לשנות בנפרד לכל משימה
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} className="gap-2" disabled={updateSettings.isPending}>
          <Save className="w-4 h-4" />
          {updateSettings.isPending ? 'שומר...' : 'שמור הגדרות'}
        </Button>
      </div>
    </div>
  );
}
