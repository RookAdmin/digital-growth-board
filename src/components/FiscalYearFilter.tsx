import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getCurrentFiscalYearRange, getFiscalYearRangeForDate, FiscalYearRange } from '@/utils/fiscalYear';

interface FiscalYearFilterProps {
  selectedFY?: string;
  onFYChange: (fyLabel: string | undefined) => void;
  className?: string;
}

export const FiscalYearFilter = ({ selectedFY, onFYChange, className }: FiscalYearFilterProps) => {
  const currentFY = getCurrentFiscalYearRange();
  const currentYear = new Date().getFullYear();
  
  // Generate last 5 fiscal years
  const fiscalYears: FiscalYearRange[] = [];
  for (let i = 0; i < 5; i++) {
    const year = currentYear - i;
    const janDate = new Date(year, 0, 1);
    fiscalYears.push(getFiscalYearRangeForDate(janDate));
  }
  
  // Remove duplicates and sort
  const uniqueFYs = Array.from(
    new Map(fiscalYears.map(fy => [fy.label, fy])).values()
  ).sort((a, b) => b.start.getTime() - a.start.getTime());

  const hasActiveFilter = selectedFY && selectedFY !== 'all';

  return (
    <div className={cn("relative", className)}>
      <select
        value={selectedFY || 'all'}
        onChange={(e) => onFYChange(e.target.value === 'all' ? undefined : e.target.value)}
        className={cn(
          "h-12 px-4 pr-10 rounded-xl border bg-white text-sm font-medium text-gray-900 transition-all duration-200 appearance-none focus:outline-none focus:ring-2 focus:ring-[#131313] focus:ring-offset-0",
          hasActiveFilter ? "border-[#131313] bg-[#FAF9F6]" : "border-gray-300"
        )}
      >
        <option value="all">All Fiscal Years</option>
        {uniqueFYs.map((fy) => (
          <option key={fy.label} value={fy.label}>
            {fy.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
    </div>
  );
};

