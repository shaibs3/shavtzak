# תכנון: הוספת תקופת תעסוקה מבצעית למערכת השיבוצים

**תאריך:** 2026-01-30
**סטטוס:** מאושר לפיתוח

---

## סקירה כללית

הוספת תכונה שמגדירה תקופת תעסוקה מבצעית גלובלית עם תאריך התחלה ותאריך סיום. השיבוצים יתבצעו רק בתוך תקופה זו, והממשק יציג רק שבועות שנמצאים בתוך התקופה.

### יעדים

1. הגדרת תקופת תעסוקה מבצעית ברמה גלובלית (Settings)
2. מניעת שיבוצים חדשים מחוץ לתקופה המוגדרת
3. הסתרת שבועות מחוץ לתקופה בממשק המשתמש
4. שמירת שיבוצים קיימים (לא מחיקה) אבל ללא הצגה אם הם מחוץ לטווח

### דרישות פונקציונליות

- הגדרת תאריך התחלה וסיום בהגדרות המערכת (Settings)
- חובה להגדיר תקופה בפעם הראשונה שהמערכת עולה
- לאחר הגדרה ראשונית - חופש מלא לשנות תאריכים (קדימה/אחורה/הארכה/קיצור)
- אלגוריתם השיבוץ האוטומטי משבץ רק בתוך התקופה
- הלוח השבועי מציג רק שבועות שבתוך התקופה
- שיבוצים קיימים מחוץ לטווח נשמרים ב-DB אבל לא מוצגים

---

## שינויי מודל נתונים

### Settings Entity

הוספת שני שדות חדשים:

```typescript
@Entity('settings')
export class Settings {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'int' })
  minBasePresence: number;

  @Column({ type: 'int' })
  totalSoldiers: number;

  // 🆕 שדות חדשים
  @Column({ type: 'date', nullable: true })
  operationalStartDate: Date | null;

  @Column({ type: 'date', nullable: true })
  operationalEndDate: Date | null;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

**הערות:**
- טיפוס `date` (לא `timestamp`) - תאריכים שלמים ללא שעות
- `nullable: true` - בהתחלה אין ערך עד ההגדרה הראשונית
- TypeORM ייצור migration אוטומטי

---

## לוגיקה עסקית

### Settings Service - כללי Validation

#### 1. תאריכי התחלה וסיום חייבים להיות ביחד

```typescript
if ((operationalStartDate && !operationalEndDate) ||
    (!operationalStartDate && operationalEndDate)) {
  throw new BadRequestException('יש להגדיר גם תאריך התחלה וגם תאריך סיום');
}
```

#### 2. תאריך סיום חייב להיות אחרי התחלה

```typescript
if (operationalStartDate >= operationalEndDate) {
  throw new BadRequestException('תאריך הסיום חייב להיות אחרי תאריך ההתחלה');
}
```

#### 3. הגדרה ראשונית חובה

```typescript
if (!existingSettings.operationalStartDate && !existingSettings.operationalEndDate) {
  if (!operationalStartDate || !operationalEndDate) {
    throw new BadRequestException('יש להגדיר תקופת תעסוקה מבצעית לפני תחילת העבודה');
  }
}
```

#### 4. לאחר הגדרה ראשונית - חופש מלא

- אפשר לשנות את התאריכים לכל כיוון (קדימה/אחורה/הארכה/קיצור)
- אין הגבלות נוספות
- שיבוצים שנשארים מחוץ לטווח לא נמחקים אבל לא יוצגו

### Assignments Service - פילטור אוטומטי

עדכון פונקציית `findAll`:

```typescript
async findAll(queryParams?: { startDate?: string; endDate?: string }) {
  const settings = await this.settingsService.getSettings();

  // אם יש תקופת תעסוקה מוגדרת, משתמשים בה כפילטר
  const filterStartDate = settings.operationalStartDate
    ? new Date(settings.operationalStartDate)
    : (queryParams?.startDate ? new Date(queryParams.startDate) : null);

  const filterEndDate = settings.operationalEndDate
    ? new Date(settings.operationalEndDate)
    : (queryParams?.endDate ? new Date(queryParams.endDate) : null);

  const query = this.assignmentRepository.createQueryBuilder('assignment');

  if (filterStartDate) {
    query.andWhere('assignment.startTime >= :startDate', { startDate: filterStartDate });
  }

  if (filterEndDate) {
    query.andWhere('assignment.endTime <= :endDate', { endDate: filterEndDate });
  }

  return query.getMany();
}
```

**תוצאה:** כל קריאה לשיבוצים תסנן אוטומטית לפי תקופת התעסוקה.

---

## אלגוריתם השיבוץ האוטומטי

עדכון פונקציית `autoSchedule`:

```typescript
async autoSchedule(startDate: Date, endDate: Date) {
  // בדיקה שיש תקופת תעסוקה מוגדרת
  const settings = await this.settingsService.getSettings();

  if (!settings.operationalStartDate || !settings.operationalEndDate) {
    throw new BadRequestException(
      'לא ניתן להריץ שיבוץ אוטומטי - יש להגדיר תקופת תעסוקה מבצעית תחילה'
    );
  }

  // חישוב החיתוך בין הטווח המבוקש לתקופת התעסוקה
  const operationalStart = new Date(settings.operationalStartDate);
  const operationalEnd = new Date(settings.operationalEndDate);

  const effectiveStartDate = startDate < operationalStart ? operationalStart : startDate;
  const effectiveEndDate = endDate > operationalEnd ? operationalEnd : endDate;

  // אם אין חיתוך - אין מה לשבץ
  if (effectiveStartDate >= effectiveEndDate) {
    return {
      message: 'הטווח המבוקש נמצא מחוץ לתקופת התעסוקה המבצעית',
      assignmentsCreated: 0
    };
  }

  // המשך השיבוץ הרגיל עם הטווח המעודכן (effectiveStartDate - effectiveEndDate)
  // ...
}
```

**תוצאה:**
- שיבוץ אוטומטי משבץ רק בתוך התקופה המוגדרת
- אם הטווח המבוקש חלקית מחוץ לתקופה - משבץ רק את החלק שבפנים

---

## שינויי API

### Update Settings DTO

```typescript
export class UpdateSettingsDto {
  @IsInt()
  @Min(0)
  minBasePresence?: number;

  @IsInt()
  @Min(1)
  totalSoldiers?: number;

  // 🆕 שדות חדשים
  @IsOptional()
  @IsDateString()
  operationalStartDate?: string;  // ISO date: "2026-01-01"

  @IsOptional()
  @IsDateString()
  operationalEndDate?: string;    // ISO date: "2026-12-31"
}
```

### API Response Example

```json
{
  "id": "uuid",
  "minBasePresence": 20,
  "totalSoldiers": 70,
  "operationalStartDate": "2026-02-01",
  "operationalEndDate": "2026-05-31",
  "updatedAt": "2026-01-30T..."
}
```

---

## שינויי Frontend

### 1. Settings Component

הוספת שדות תאריכים:

```typescript
<div className="border-t pt-4">
  <h3 className="text-lg font-semibold mb-4">תקופת תעסוקה מבצעית</h3>

  <div className="grid grid-cols-2 gap-4">
    <div>
      <label>תאריך התחלה</label>
      <input
        type="date"
        value={operationalStartDate?.toISOString().split('T')[0] || ''}
        onChange={(e) => setOperationalStartDate(new Date(e.target.value))}
        required
      />
    </div>

    <div>
      <label>תאריך סיום</label>
      <input
        type="date"
        value={operationalEndDate?.toISOString().split('T')[0] || ''}
        onChange={(e) => setOperationalEndDate(new Date(e.target.value))}
        required
      />
    </div>
  </div>

  <p className="text-sm text-muted-foreground mt-2">
    שיבוצים יתאפשרו רק בתוך תקופה זו. ניתן לשנות תאריכים בכל עת.
  </p>
</div>
```

### 2. Schedule Component

עדכונים:

1. **בדיקה אם השבוע בתוך התקופה:**

```typescript
const isWeekInOperationalPeriod = useMemo(() => {
  if (!settings?.operationalStartDate || !settings?.operationalEndDate) {
    return false;
  }

  const weekEnd = endOfWeek(currentWeekStart);
  const opStart = new Date(settings.operationalStartDate);
  const opEnd = new Date(settings.operationalEndDate);

  return currentWeekStart <= opEnd && weekEnd >= opStart;
}, [currentWeekStart, settings]);
```

2. **הגבלת ניווט:**

```typescript
const canNavigatePrevious = useMemo(() => {
  if (!settings?.operationalStartDate) return false;
  const previousWeek = subWeeks(currentWeekStart, 1);
  const opStart = new Date(settings.operationalStartDate);
  return endOfWeek(previousWeek) >= opStart;
}, [currentWeekStart, settings]);

const canNavigateNext = useMemo(() => {
  if (!settings?.operationalEndDate) return false;
  const nextWeek = addWeeks(currentWeekStart, 1);
  const opEnd = new Date(settings.operationalEndDate);
  return startOfWeek(nextWeek) <= opEnd;
}, [currentWeekStart, settings]);
```

3. **הצגת הודעה אם אין תקופה מוגדרת:**

```typescript
if (!settings?.operationalStartDate || !settings?.operationalEndDate) {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <h3>לא הוגדרה תקופת תעסוקה מבצעית</h3>
        <p>יש להגדיר תקופת תעסוקה בהגדרות לפני תחילת השיבוץ</p>
        <Button onClick={() => navigate('/settings')}>עבור להגדרות</Button>
      </div>
    </div>
  );
}
```

---

## תרחישי שימוש (Use Cases)

### תרחיש 1: התקנה ראשונית

1. משתמש נכנס למערכת בפעם הראשונה
2. מנסה להיכנס ללוח השבועי
3. רואה הודעה: "לא הוגדרה תקופת תעסוקה מבצעית"
4. לוחץ על "עבור להגדרות"
5. מגדיר תאריך התחלה: 01/02/2026, תאריך סיום: 31/05/2026
6. שומר
7. חוזר ללוח השבועי - עכשיו רואה את השבועות בתוך התקופה

### תרחיש 2: שיבוץ אוטומטי

1. משתמש בלוח השבועי (שבוע של 10/02/2026)
2. לוחץ על "שיבוץ אוטומטי"
3. בוחר טווח: 01/02/2026 - 15/03/2026
4. תקופת תעסוקה מוגדרת: 01/02/2026 - 31/05/2026
5. אלגוריתם משבץ את כל הטווח המבוקש (כולו בפנים)
6. רואה שיבוצים חדשים בלוח

### תרחיש 3: שיבוץ חלקי מחוץ לתקופה

1. תקופת תעסוקה: 01/02/2026 - 31/05/2026
2. משתמש מנסה לשבץ אוטומטית: 15/01/2026 - 15/02/2026
3. אלגוריתם משבץ רק: 01/02/2026 - 15/02/2026
4. מחזיר הודעה: "נוצרו X שיבוצים בתקופה 2026-02-01 - 2026-02-15"

### תרחיש 4: שינוי תקופת תעסוקה

1. תקופה נוכחית: 01/02/2026 - 31/05/2026
2. יש שיבוצים קיימים בתוך התקופה
3. משתמש משנה ל: 15/02/2026 - 30/06/2026 (מקצר התחלה, מאריך סוף)
4. שיבוצים מ-01/02 עד 14/02 נשארים ב-DB אבל לא מוצגים
5. הלוח השבועי מתחיל מ-15/02/2026

### תרחיש 5: ניווט בלוח

1. תקופת תעסוקה: 01/02/2026 - 28/02/2026 (חודש פברואר)
2. משתמש בשבוע של 10/02/2026
3. לוחץ "שבוע קודם" → עובר ל-03/02/2026
4. לוחץ "שבוע קודם" שוב → הכפתור מושבת (השבוע הבא מחוץ לתקופה)
5. לוחץ "שבוע הבא" עד 24/02/2026
6. לוחץ "שבוע הבא" שוב → הכפתור מושבת (השבוע הבא מחוץ לתקופה)

---

## טיפול בשגיאות

### Backend Errors

| שגיאה | קוד HTTP | הודעה |
|-------|----------|-------|
| חסר תאריך התחלה או סיום | 400 | "יש להגדיר גם תאריך התחלה וגם תאריך סיום" |
| תאריך סיום לפני התחלה | 400 | "תאריך הסיום חייב להיות אחרי תאריך ההתחלה" |
| הגדרה ראשונית חסרה | 400 | "יש להגדיר תקופת תעסוקה מבצעית לפני תחילת העבודה" |
| שיבוץ אוטומטי ללא תקופה | 400 | "לא ניתן להריץ שיבוץ אוטומטי - יש להגדיר תקופת תעסוקה מבצעית תחילה" |

### Frontend Error Handling

- טופס הגדרות: הצגת הודעת שגיאה מתחת לשדות תאריכים
- לוח שבועי: הצגת toast/notification אם יש שגיאה
- חסימת כפתורים במקרה של מצב לא חוקי

---

## מיגרציה (Migration Strategy)

### שלב 1: עדכון Schema

```typescript
// TypeORM ייצור migration אוטומטי:
// migration/1738252800000-AddOperationalPeriod.ts

export class AddOperationalPeriod1738252800000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn('settings', new TableColumn({
      name: 'operationalStartDate',
      type: 'date',
      isNullable: true
    }));

    await queryRunner.addColumn('settings', new TableColumn({
      name: 'operationalEndDate',
      type: 'date',
      isNullable: true
    }));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('settings', 'operationalStartDate');
    await queryRunner.dropColumn('settings', 'operationalEndDate');
  }
}
```

### שלב 2: Seeding (אופציונלי)

אם רוצים תקופה ברירת מחדל בסביבת dev:

```typescript
// database/seeds/settings.seed.ts
await settingsRepository.update(existingSettings.id, {
  operationalStartDate: new Date('2026-02-01'),
  operationalEndDate: new Date('2026-05-31')
});
```

---

## בדיקות (Testing)

### Backend Tests

1. **Settings Service Tests:**
   - ✅ שמירת תקופה חדשה (תקין)
   - ✅ שגיאה: חסר תאריך התחלה
   - ✅ שגיאה: חסר תאריך סיום
   - ✅ שגיאה: תאריך סיום לפני התחלה
   - ✅ עדכון תקופה קיימת (כל הכיוונים)

2. **Assignments Service Tests:**
   - ✅ `findAll` מסנן לפי תקופת תעסוקה
   - ✅ שיבוצים מחוץ לתקופה לא מוחזרים

3. **Auto-Schedule Tests:**
   - ✅ שגיאה: אין תקופה מוגדרת
   - ✅ שיבוץ בתוך התקופה (מלא)
   - ✅ שיבוץ חלקי (חיתוך עם התקופה)
   - ✅ שיבוץ לגמרי מחוץ לתקופה (0 שיבוצים)

### Frontend Tests (E2E)

1. **Settings Tests:**
   - ✅ הגדרת תקופה בפעם הראשונה
   - ✅ עדכון תקופה קיימת
   - ✅ validation errors מוצגים נכון

2. **Schedule Tests:**
   - ✅ הודעה "לא הוגדרה תקופה" מוצגת בהתחלה
   - ✅ לוח מציג רק שבועות בתוך התקופה
   - ✅ ניווט חסום בקצוות התקופה
   - ✅ שיבוץ אוטומטי עובד רק בתוך התקופה

---

## סיכום שינויים

### Backend
- ✅ Settings Entity: 2 עמודות חדשות (`operationalStartDate`, `operationalEndDate`)
- ✅ Settings Service: validation logic
- ✅ Assignments Service: פילטור אוטומטי
- ✅ Auto-Schedule Service: חיתוך לפי תקופה
- ✅ DTOs: עדכון `UpdateSettingsDto`

### Frontend
- ✅ Settings Component: 2 שדות תאריך חדשים
- ✅ Schedule Component: הגבלת ניווט והצגה
- ✅ Hooks: שימוש בתקופה מההגדרות

### Database
- ✅ Migration: הוספת 2 עמודות ל-`settings`
- ✅ שיבוצים קיימים נשמרים (לא נמחקים)

---

## עבודה עתידית (Out of Scope)

- תמיכה במספר תקופות תעסוקה מקבילות
- תקופות תעסוקה ברמת חייל (override גלובלי)
- ארכיון אוטומטי של שיבוצים מחוץ לתקופה
- דוחות על תקופות תעסוקה עבר

---

**מסמך זה מאושר ליישום** ✅
