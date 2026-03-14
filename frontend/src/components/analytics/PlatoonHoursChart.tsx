import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { PlatoonAnalytics } from './AnalyticsView';

interface PlatoonHoursChartProps {
  data: PlatoonAnalytics[];
}

const SHIFT_COLORS = {
  morning: '#f59e0b',   // amber - בוקר
  afternoon: '#3b82f6', // blue - צהריים
  night: '#6366f1',     // indigo - לילה
};

const SHIFT_LABELS = {
  morning: 'בוקר',
  afternoon: 'צהריים',
  night: 'לילה',
};

export function PlatoonHoursChart({ data }: PlatoonHoursChartProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>שעות לפי מחלקה</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            אין נתונים להצגה
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartData = data.map(d => ({
    name: d.platoonName,
    בוקר: d.morning,
    צהריים: d.afternoon,
    לילה: d.night,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>שעות לפי מחלקה</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis label={{ value: 'שעות', angle: -90, position: 'insideLeft' }} />
            <Tooltip
              contentStyle={{ direction: 'rtl', textAlign: 'right' }}
              formatter={(value: number) => [`${value} שעות`, '']}
            />
            <Legend
              wrapperStyle={{ direction: 'rtl' }}
              formatter={(value) => value}
            />
            <Bar dataKey="בוקר" fill={SHIFT_COLORS.morning} />
            <Bar dataKey="צהריים" fill={SHIFT_COLORS.afternoon} />
            <Bar dataKey="לילה" fill={SHIFT_COLORS.night} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
