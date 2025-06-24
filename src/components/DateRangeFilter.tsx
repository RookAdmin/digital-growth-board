
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Calendar, X } from 'lucide-react';
import { format } from 'date-fns';

interface DateRangeFilterProps {
  startDate?: Date;
  endDate?: Date;
  onDateRangeChange: (startDate?: Date, endDate?: Date) => void;
}

export const DateRangeFilter = ({ startDate, endDate, onDateRangeChange }: DateRangeFilterProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tempStartDate, setTempStartDate] = useState<Date | undefined>(startDate);
  const [tempEndDate, setTempEndDate] = useState<Date | undefined>(endDate);

  const handleApply = () => {
    onDateRangeChange(tempStartDate, tempEndDate);
    setIsOpen(false);
  };

  const handleClear = () => {
    setTempStartDate(undefined);
    setTempEndDate(undefined);
    onDateRangeChange(undefined, undefined);
    setIsOpen(false);
  };

  const getButtonText = () => {
    if (startDate && endDate) {
      return `${format(startDate, 'MMM dd')} - ${format(endDate, 'MMM dd, yyyy')}`;
    }
    if (startDate) {
      return `From ${format(startDate, 'MMM dd, yyyy')}`;
    }
    if (endDate) {
      return `Until ${format(endDate, 'MMM dd, yyyy')}`;
    }
    return 'Filter by date range';
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-[240px] justify-start text-left font-normal">
          <Calendar className="mr-2 h-4 w-4" />
          {getButtonText()}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-3 space-y-3">
          <div className="text-sm font-medium">Select Date Range</div>
          
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground">Start Date</label>
              <CalendarComponent
                mode="single"
                selected={tempStartDate}
                onSelect={setTempStartDate}
                className="rounded-md border"
              />
            </div>
            
            <div>
              <label className="text-xs text-muted-foreground">End Date</label>
              <CalendarComponent
                mode="single"
                selected={tempEndDate}
                onSelect={setTempEndDate}
                className="rounded-md border"
                disabled={(date) => tempStartDate ? date < tempStartDate : false}
              />
            </div>
          </div>

          <div className="flex gap-2 pt-3 border-t">
            <Button onClick={handleClear} variant="outline" size="sm" className="flex-1">
              <X className="mr-2 h-4 w-4" />
              Clear
            </Button>
            <Button onClick={handleApply} size="sm" className="flex-1">
              Apply
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
