
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Calendar, X, ChevronDown } from 'lucide-react';
import { format } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

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

  useEffect(() => {
    setTempStartDate(startDate);
    setTempEndDate(endDate);
    setTempSingleDate(singleDate);
  }, [startDate, endDate, singleDate]);

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

  const hasActiveFilter = singleDate || startDate || endDate;

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
    return 'Date';
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "h-12 px-4 rounded-xl border bg-white text-sm font-medium text-gray-900 transition-all duration-200 flex items-center gap-2 hover:border-[#131313] focus:outline-none focus:ring-2 focus:ring-[#131313] focus:ring-offset-0",
            hasActiveFilter ? "border-[#131313] bg-[#FAF9F6]" : "border-gray-300"
          )}
        >
          <Calendar className="h-4 w-4 text-gray-500" />
          <span>{getButtonText()}</span>
          <ChevronDown className="h-4 w-4 text-gray-400" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 border-gray-200 shadow-lg" align="start">
        <div className="p-4">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'single' | 'range')}>
            <TabsList className="grid w-full grid-cols-2 mb-4 bg-gray-50">
              <TabsTrigger value="single" className="text-xs">Single</TabsTrigger>
              <TabsTrigger value="range" className="text-xs">Range</TabsTrigger>
            </TabsList>
            
            <TabsContent value="single" className="space-y-3 mt-0">
              <CalendarComponent
                mode="single"
                selected={tempSingleDate}
                onSelect={setTempSingleDate}
                className="rounded-lg border-0"
              />
            </TabsContent>
            
            <TabsContent value="range" className="space-y-3 mt-0">
              <div className="flex gap-3">
                <div className="flex-1">
                  <p className="text-xs font-medium text-gray-500 mb-2">Start</p>
                  <CalendarComponent
                    mode="single"
                    selected={tempStartDate}
                    onSelect={setTempStartDate}
                    className="rounded-lg border-0"
                  />
                </div>
                
                <div className="flex-1">
                  <p className="text-xs font-medium text-gray-500 mb-2">End</p>
                  <CalendarComponent
                    mode="single"
                    selected={tempEndDate}
                    onSelect={setTempEndDate}
                    className="rounded-lg border-0"
                    disabled={(date) => tempStartDate ? date < tempStartDate : false}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex gap-2 pt-3 border-t border-gray-100">
            <Button 
              onClick={handleClear} 
              variant="ghost" 
              size="sm" 
              className="flex-1 text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            >
              Clear
            </Button>
            <Button 
              onClick={handleApply} 
              size="sm" 
              className="flex-1 bg-[#131313] text-white hover:bg-black"
            >
              Apply
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
