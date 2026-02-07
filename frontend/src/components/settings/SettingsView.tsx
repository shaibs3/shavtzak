import { useState, useEffect } from 'react';
import { Save, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSettings, useUpdateSettings } from '@/hooks/useSettings';

export function SettingsView() {
  const { data: settings, isLoading, error, refetch } = useSettings();
  const updateSettings = useUpdateSettings();

  const [minBasePresence, setMinBasePresence] = useState(0);
  const [totalSoldiers, setTotalSoldiers] = useState(0);
  const [operationalStartDate, setOperationalStartDate] = useState('');
  const [operationalEndDate, setOperationalEndDate] = useState('');
  const [customRoles, setCustomRoles] = useState<string[]>([]);
  const [newRoleName, setNewRoleName] = useState('');

  // Update local state when settings are loaded
  useEffect(() => {
    if (settings) {
      setMinBasePresence(settings.minBasePresence);
      setTotalSoldiers(settings.totalSoldiers);
      setOperationalStartDate(settings.operationalStartDate || '');
      setOperationalEndDate(settings.operationalEndDate || '');
      setCustomRoles(settings.customRoles || []);
    }
  }, [settings]);

  const handleAddRole = () => {
    const trimmed = newRoleName.trim();
    if (trimmed && !customRoles.includes(trimmed)) {
      setCustomRoles([...customRoles, trimmed]);
      setNewRoleName('');
    }
  };

  const handleRemoveRole = (role: string) => {
    setCustomRoles(customRoles.filter(r => r !== role));
  };

  const handleSave = () => {
    updateSettings.mutate({
      minBasePresence,
      totalSoldiers,
      operationalStartDate: operationalStartDate || undefined,
      operationalEndDate: operationalEndDate || undefined,
      customRoles: customRoles.length > 0 ? customRoles : undefined,
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
          <h3 className="text-lg font-semibold mb-4">תפקידים מותאמים אישית</h3>
          
          <div className="space-y-4">
            <div>
              <Label>תפקידים ברירת מחדל</Label>
              <div className="mt-1.5 flex flex-wrap gap-2">
                <span className="px-3 py-1.5 bg-primary/10 text-primary rounded-md text-sm font-medium">מפקד</span>
                <span className="px-3 py-1.5 bg-primary/10 text-primary rounded-md text-sm font-medium">נהג</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                תפקידים אלה זמינים תמיד ואינם ניתנים למחיקה. כל החיילים הם חיילים בהגדרה, ולכן אין צורך לציין זאת במפורש.
              </p>
            </div>

            <div>
              <Label htmlFor="newRole">הוסף תפקיד מותאם אישית</Label>
              <div className="flex gap-2 mt-1.5">
                <Input
                  id="newRole"
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  placeholder="לדוגמה: רופא, טכנאי"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddRole();
                    }
                  }}
                />
                <Button
                  type="button"
                  onClick={handleAddRole}
                  disabled={!newRoleName.trim() || customRoles.includes(newRoleName.trim())}
                  className="gap-2"
                >
                  <Plus className="w-4 h-4" />
                  הוסף
                </Button>
              </div>
            </div>

            {customRoles.length > 0 && (
              <div>
                <Label>תפקידים מותאמים אישית</Label>
                <div className="mt-1.5 flex flex-wrap gap-2">
                  {customRoles.map((role) => (
                    <div
                      key={role}
                      className="flex items-center gap-2 px-3 py-1.5 bg-secondary rounded-md"
                    >
                      <span className="text-sm font-medium">{role}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveRole(role)}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-xs text-muted-foreground">
                תפקידים מותאמים אישית יופיעו כאפשרויות בעת הוספת חיילים ומשימות.
                ניתן להשתמש בהם כמו בתפקידים ברירת המחדל.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-xl p-6 shadow-card">
        <h3 className="text-lg font-semibold mb-4">תקופת תעסוקה מבצעית</h3>

        <div className="space-y-4">
          <div>
            <Label htmlFor="operationalStartDate">תאריך התחלה</Label>
            <Input
              id="operationalStartDate"
              type="date"
              value={operationalStartDate}
              onChange={(e) => setOperationalStartDate(e.target.value)}
              className="mt-1.5"
            />
            <p className="text-xs text-muted-foreground mt-1">
              תאריך התחלת התקופה המבצעית
            </p>
          </div>

          <div>
            <Label htmlFor="operationalEndDate">תאריך סיום</Label>
            <Input
              id="operationalEndDate"
              type="date"
              value={operationalEndDate}
              onChange={(e) => setOperationalEndDate(e.target.value)}
              className="mt-1.5"
            />
            <p className="text-xs text-muted-foreground mt-1">
              תאריך סיום התקופה המבצעית
            </p>
          </div>

          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-xs text-muted-foreground">
              תקופת התעסוקה המבצעית משמשת לחישובי תכנון ואופטימיזציה של השיבוצים.
              השאר ריק לתקופה בלתי מוגבלת.
            </p>
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
