
import { KanbanBoard } from '@/components/KanbanBoard';
import { Header } from '@/components/Header';
import { AddLeadDialog } from '@/components/AddLeadDialog';
import { UnifiedDateFilter } from '@/components/UnifiedDateFilter';
import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ChartBarIncreasing, Search } from 'lucide-react';

const DashboardPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<Date | undefined>(undefined);
  const [startDateFilter, setStartDateFilter] = useState<Date | undefined>(undefined);
  const [endDateFilter, setEndDateFilter] = useState<Date | undefined>(undefined);

  const handleDateRangeChange = (startDate?: Date, endDate?: Date) => {
    setStartDateFilter(startDate);
    setEndDateFilter(endDate);
  };

  const handleSingleDateChange = (date: Date | undefined) => {
    setDateFilter(date);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header isAuthenticated={true} />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 sm:mb-8 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-gray-900">Leads Dashboard</h1>
            <p className="text-sm sm:text-base lg:text-lg text-gray-600 mt-1 font-light">Drag and drop to manage your sales pipeline.</p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-600 z-10" />
              <Input
                placeholder="Search by name, email, phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white border border-gray-200 text-gray-900 placeholder:text-gray-500 focus:ring-2 focus:ring-gray-200 focus:border-gray-300 rounded-xl shadow-sm h-10 sm:h-11 w-full sm:w-64"
                maxLength={18}
              />
            </div>
            
            <UnifiedDateFilter
              startDate={startDateFilter}
              endDate={endDateFilter}
              singleDate={dateFilter}
              onDateRangeChange={handleDateRangeChange}
              onSingleDateChange={handleSingleDateChange}
            />

            <Link to="/dashboard/reporting">
              <Button 
                variant="outline" 
                className="bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 rounded-xl shadow-sm h-10 sm:h-11 w-full sm:w-auto"
              >
                <ChartBarIncreasing className="mr-2 h-4 w-4" />
                View Reports
              </Button>
            </Link>
            <AddLeadDialog />
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <KanbanBoard 
            searchTerm={searchTerm} 
            dateFilter={dateFilter}
            startDateFilter={startDateFilter}
            endDateFilter={endDateFilter}
          />
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;
