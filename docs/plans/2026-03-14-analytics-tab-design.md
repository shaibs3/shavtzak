# Analytics Tab Design

## Overview

Add an analytics tab showing guard hours per platoon, broken down by shift type (morning/afternoon/night), with flexible date range selection.

## Requirements

- Display hours per platoon by shift type
- Flexible date range picker
- Table view with exact numbers
- Bar chart for visual comparison
- Show average hours per soldier for fairness comparison

## UI Structure

```
┌─────────────────────────────────────────────────┐
│  אנליטיקות שעות שמירה                            │
│  ─────────────────────────────────────────────  │
│  [תאריך התחלה] [תאריך סיום]  [עדכן]              │
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │         Grouped Bar Chart               │   │
│  │   (platoon on X, hours on Y)            │   │
│  │   colors: morning/afternoon/night       │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │ מחלקה │ בוקר │צהריים│ לילה │סה"כ│ממוצע  │   │
│  │───────│──────│──────│──────│────│לחייל  │   │
│  │ א'    │  120 │  96  │  64  │ 280│ 20.0  │   │
│  └─────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

## Shift Classification

Based on `task.shiftStartHour`:

| Shift Type | Hebrew | Hour Range |
|------------|--------|------------|
| Morning | בוקר | 6 <= hour < 14 |
| Afternoon | צהריים | 14 <= hour < 22 |
| Night | לילה | hour >= 22 OR hour < 6 |

## Data Structure

```typescript
interface PlatoonAnalytics {
  platoonId: string;
  platoonName: string;
  platoonColor: string;
  soldierCount: number;
  morning: number;      // morning hours
  afternoon: number;    // afternoon hours
  night: number;        // night hours
  total: number;        // total hours
  avgPerSoldier: number; // average per soldier
}
```

## Calculation Logic

1. Fetch all assignments within selected date range
2. For each assignment:
   - Find soldier → get platoonId
   - Find task → get shiftStartHour and shiftDuration
   - Classify shift type by shiftStartHour
3. Aggregate hours by: `platoon × shift type`
4. Calculate average: `total platoon hours / soldier count`

## New Files

```
frontend/src/components/analytics/
├── AnalyticsView.tsx      # Main page component
├── DateRangePicker.tsx    # Date range selector
├── PlatoonHoursChart.tsx  # Recharts bar chart
└── PlatoonHoursTable.tsx  # Data table
```

## Modified Files

- `frontend/src/components/layout/Sidebar.tsx` - Add analytics tab
- `frontend/src/pages/Index.tsx` - Add analytics case

## Dependencies

- Recharts (already installed) for bar chart

## Defaults

- Start date: operational period start
- End date: today
