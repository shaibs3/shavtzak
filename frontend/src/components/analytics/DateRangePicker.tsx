import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { Calendar } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface DateRangePickerProps {
  startDate: Date;
  endDate: Date;
  onStartDateChange: (date: Date) => void;
  onEndDateChange: (date: Date) => void;
  minDate?: Date;
  maxDate?: Date;
}

export function DateRangePicker({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  minDate,
  maxDate,
}: DateRangePickerProps) {
  const handleStartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = new Date(e.target.value);
    if (!isNaN(date.getTime())) {
      onStartDateChange(date);
    }
  };

  const handleEndChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = new Date(e.target.value);
    if (!isNaN(date.getTime())) {
      onEndDateChange(date);
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="w-5 h-5" />
            <span className="font-medium">טווח תאריכים:</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="space-y-1">
              <Label htmlFor="start-date" className="text-sm">
                מתאריך
              </Label>
              <Input
                id="start-date"
                type="date"
                value={format(startDate, 'yyyy-MM-dd')}
                onChange={handleStartChange}
                min={minDate ? format(minDate, 'yyyy-MM-dd') : undefined}
                max={format(endDate, 'yyyy-MM-dd')}
                className="w-40"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="end-date" className="text-sm">
                עד תאריך
              </Label>
              <Input
                id="end-date"
                type="date"
                value={format(endDate, 'yyyy-MM-dd')}
                onChange={handleEndChange}
                min={format(startDate, 'yyyy-MM-dd')}
                max={maxDate ? format(maxDate, 'yyyy-MM-dd') : undefined}
                className="w-40"
              />
            </div>
          </div>

          <div className="text-sm text-muted-foreground">
            {format(startDate, 'd בMMMM yyyy', { locale: he })} - {format(endDate, 'd בMMMM yyyy', { locale: he })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
