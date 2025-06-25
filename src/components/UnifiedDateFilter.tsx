
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Calendar, X } from 'lucide-react';
import { format } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface UnifiedDateFilterProps {
  startDate?: Date;
  endDate?: Date;
  singleDate?: Date;
  onDateRangeChange: (startDate?: Date, endDate?: Date) => void;
  onSingleDateChange: (date?: Date) => void;
}

export const UnifiedDateFilter = ({ 
  startDate, 
  endDate, 
  singleDate,
  onDateRangeChange, 
  onSingleDateChange 
}: UnifiedDateFilterProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'single' | 'range'>('single');
  const [tempStartDate, setTempStartDate] = useState<Date | undefined>(startDate);
  const [tempEndDate, setTempEndDate] = useState<Date | undefined>(endDate);
  const [tempSingleDate, setTempSingleDate] = useState<Date | undefined>(singleDate);

  const handleApply = () => {
    if (activeTab === 'single') {
      onSingleDateChange(tempSingleDate);
      onDateRangeChange(undefined, undefined);
    } else {
      onDateRangeChange(tempStartDate, tempEndDate);
      onSingleDateChange(undefined);
    }
    setIsOpen(false);
  };

  const handleClear = () => {
    setTempStartDate(undefined);
    setTempEndDate(undefined);
    setTempSingleDate(undefined);
    onDateRangeChange(undefined, undefined);
    onSingleDateChange(undefined);
    setIsOpen(false);
  };

  const getButtonText = () => {
    if (singleDate) {
      return format(singleDate, 'MMM dd, yyyy');
    }
    if (startDate && endDate) {
      return `${format(startDate, 'MMM dd')} - ${format(endDate, 'MMM dd, yyyy')}`;
    }
    if (startDate) {
      return `From ${format(startDate, 'MMM dd, yyyy')}`;
    }
    if (endDate) {
      return `Until ${format(endDate, 'MMM dd, yyyy')}`;
    }
    return 'Filter by date';
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
        <div className="p-3">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'single' | 'range')}>
            <TabsList className="grid w-full grid-cols-2 mb-3">
              <TabsTrigger value="single">Single Date</TabsTrigger>
              <TabsTrigger value="range">Date Range</TabsTrigger>
            </TabsList>
            
            <TabsContent value="single" className="space-y-3">
              <div className="text-sm font-medium">Select Date</div>
              <CalendarComponent
                mode="single"
                selected={tempSingleDate}
                onSelect={setTempSingleDate}
                className="rounded-md border"
              />
            </TabsContent>
            
            <TabsContent value="range" className="space-y-3">
              <div className="text-sm font-medium">Select Date Range</div>
              
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-xs text-muted-foreground">Start Date</label>
                  <CalendarComponent
                    mode="single"
                    selected={tempStartDate}
                    onSelect={setTempStartDate}
                    className="rounded-md border"
                  />
                </div>
                
                <div className="flex-1">
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
            </TabsContent>
          </Tabs>

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
