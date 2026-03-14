import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { PlatoonAnalytics } from './AnalyticsView';

interface PlatoonHoursTableProps {
  data: PlatoonAnalytics[];
}

export function PlatoonHoursTable({ data }: PlatoonHoursTableProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>פירוט שעות</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            אין נתונים להצגה
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate totals
  const totals = data.reduce(
    (acc, d) => ({
      morning: acc.morning + d.morning,
      afternoon: acc.afternoon + d.afternoon,
      night: acc.night + d.night,
      total: acc.total + d.total,
      soldierCount: acc.soldierCount + d.soldierCount,
    }),
    { morning: 0, afternoon: 0, night: 0, total: 0, soldierCount: 0 }
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>פירוט שעות</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">מחלקה</TableHead>
              <TableHead className="text-center">חיילים</TableHead>
              <TableHead className="text-center">בוקר</TableHead>
              <TableHead className="text-center">צהריים</TableHead>
              <TableHead className="text-center">לילה</TableHead>
              <TableHead className="text-center">סה"כ</TableHead>
              <TableHead className="text-center">ממוצע לחייל</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row) => (
              <TableRow key={row.platoonId}>
                <TableCell className="text-right font-medium">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: row.platoonColor }}
                    />
                    {row.platoonName}
                  </div>
                </TableCell>
                <TableCell className="text-center">{row.soldierCount}</TableCell>
                <TableCell className="text-center">{row.morning}</TableCell>
                <TableCell className="text-center">{row.afternoon}</TableCell>
                <TableCell className="text-center">{row.night}</TableCell>
                <TableCell className="text-center font-medium">{row.total}</TableCell>
                <TableCell className="text-center font-medium">
                  {row.avgPerSoldier.toFixed(1)}
                </TableCell>
              </TableRow>
            ))}
            {/* Totals row */}
            <TableRow className="bg-muted/50 font-bold">
              <TableCell className="text-right">סה"כ</TableCell>
              <TableCell className="text-center">{totals.soldierCount}</TableCell>
              <TableCell className="text-center">{totals.morning}</TableCell>
              <TableCell className="text-center">{totals.afternoon}</TableCell>
              <TableCell className="text-center">{totals.night}</TableCell>
              <TableCell className="text-center">{totals.total}</TableCell>
              <TableCell className="text-center">
                {totals.soldierCount > 0
                  ? (totals.total / totals.soldierCount).toFixed(1)
                  : '0.0'}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
