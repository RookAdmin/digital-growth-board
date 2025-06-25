
import { KanbanBoard } from '@/components/KanbanBoard';
import { Header } from '@/components/Header';
import { AddLeadDialog } from '@/components/AddLeadDialog';
import { UnifiedDateFilter } from '@/components/UnifiedDateFilter';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ChartBarIncreasing } from 'lucide-react';

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
    <div className="flex flex-col min-h-screen bg-background">
      <Header isAuthenticated={true} />
      <main className="flex-1 flex flex-col">
          <div className="px-6 pt-6 pb-2 flex justify-between items-center flex-shrink-0">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Leads Dashboard</h1>
              <p className="text-muted-foreground">Drag and drop to manage your sales pipeline.</p>
            </div>
            <div className="flex items-center gap-4">
              <Input
                placeholder="Search by name, email, phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
              
              <UnifiedDateFilter
                startDate={startDateFilter}
                endDate={endDateFilter}
                singleDate={dateFilter}
                onDateRangeChange={handleDateRangeChange}
                onSingleDateChange={handleSingleDateChange}
              />

              <Link to="/dashboard/reporting">
                <Button variant="outline">
                  <ChartBarIncreasing className="mr-2 h-4 w-4" />
                  View Reports
                </Button>
              </Link>
              <AddLeadDialog />
            </div>
          </div>
          <div className="flex-1 px-6 pb-6 overflow-x-auto kanban-container">
            <style>{`
              .kanban-container::-webkit-scrollbar {
                height: 8px;
              }
              .kanban-container::-webkit-scrollbar-track {
                background: #f1f5f9;
                border-radius: 4px;
                margin: 0 20px;
              }
              .kanban-container::-webkit-scrollbar-thumb {
                background: linear-gradient(90deg, #10b981, #059669);
                border-radius: 4px;
                transition: all 0.2s ease;
              }
              .kanban-container::-webkit-scrollbar-thumb:hover {
                background: linear-gradient(90deg, #059669, #047857);
              }
              .kanban-container {
                scrollbar-width: thin;
                scrollbar-color: #10b981 #f1f5f9;
              }
            `}</style>
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
