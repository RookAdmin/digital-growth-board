import { useState } from 'react';
import { SearchInput } from './SearchInput';
import { UnifiedDateFilter } from './UnifiedDateFilter';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface FilterBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  startDate?: Date;
  endDate?: Date;
  singleDate?: Date;
  onDateRangeChange: (startDate?: Date, endDate?: Date) => void;
  onSingleDateChange: (date?: Date) => void;
  showDateFilter?: boolean;
}

export const FilterBar = ({
  searchTerm,
  onSearchChange,
  searchPlaceholder = "Search...",
  startDate,
  endDate,
  singleDate,
  onDateRangeChange,
  onSingleDateChange,
  showDateFilter = true,
}: FilterBarProps) => {
  const hasActiveFilters = searchTerm || startDate || endDate || singleDate;

  const clearAllFilters = () => {
    onSearchChange('');
    onDateRangeChange(undefined, undefined);
    onSingleDateChange(undefined);
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6 p-4 bg-white rounded-lg border border-gray-200">
      <div className="flex-1">
        <SearchInput
          value={searchTerm}
          onChange={onSearchChange}
          placeholder={searchPlaceholder}
          className="w-full"
        />
      </div>
      
      {showDateFilter && (
        <div className="flex gap-2">
          <UnifiedDateFilter
            startDate={startDate}
            endDate={endDate}
            singleDate={singleDate}
            onDateRangeChange={onDateRangeChange}
            onSingleDateChange={onSingleDateChange}
          />
          
          {hasActiveFilters && (
            <Button
              variant="outline"
              onClick={clearAllFilters}
              className="px-3"
            >
              <X className="h-4 w-4 mr-1" />
              Clear
            </Button>
          )}
        </div>
      )}
    </div>
  );
};