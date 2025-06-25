
import { KanbanBoard } from '@/components/KanbanBoard';
import { Header } from '@/components/Header';
import { AddLeadDialog } from '@/components/AddLeadDialog';
import { UnifiedDateFilter } from '@/components/UnifiedDateFilter';
import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ChartBarIncreasing } from 'lucide-react';

const DashboardPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<Date | undefined>(undefined);
  const [startDateFilter, setStartDateFilter] = useState<Date | undefined>(undefined);
  const [endDateFilter, setEndDateFilter] = useState<Date | undefined>(undefined);
  const kanbanContainerRef = useRef<HTMLDivElement>(null);
  const fixedScrollRef = useRef<HTMLDivElement>(null);

  const handleDateRangeChange = (startDate?: Date, endDate?: Date) => {
    setStartDateFilter(startDate);
    setEndDateFilter(endDate);
  };

  const handleSingleDateChange = (date: Date | undefined) => {
    setDateFilter(date);
  };

  // Sync scroll between kanban container and fixed scroll bar
  useEffect(() => {
    const kanbanContainer = kanbanContainerRef.current;
    const fixedScroll = fixedScrollRef.current;

    if (!kanbanContainer || !fixedScroll) return;

    const syncScrollFromKanban = () => {
      if (fixedScroll) {
        fixedScroll.scrollLeft = kanbanContainer.scrollLeft;
      }
    };

    const syncScrollFromFixed = () => {
      if (kanbanContainer) {
        kanbanContainer.scrollLeft = fixedScroll.scrollLeft;
      }
    };

    kanbanContainer.addEventListener('scroll', syncScrollFromKanban);
    fixedScroll.addEventListener('scroll', syncScrollFromFixed);

    return () => {
      kanbanContainer.removeEventListener('scroll', syncScrollFromKanban);
      fixedScroll.removeEventListener('scroll', syncScrollFromFixed);
    };
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-background overflow-x-hidden relative">
      <Header isAuthenticated={true} />
      <main className="flex-1 flex flex-col overflow-hidden">
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
                maxLength={18}
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
          <div 
            ref={kanbanContainerRef}
            className="flex-1 px-6 pb-6 overflow-x-auto kanban-container relative"
            style={{ paddingBottom: '20px' }}
          >
            <KanbanBoard 
              searchTerm={searchTerm} 
              dateFilter={dateFilter}
              startDateFilter={startDateFilter}
              endDateFilter={endDateFilter}
            />
          </div>
      </main>
      
      {/* Fixed horizontal scroll bar at bottom of page */}
      <div className="fixed bottom-0 left-0 right-0 h-4 bg-gray-100 z-50 border-t">
        <div 
          ref={fixedScrollRef}
          className="h-full overflow-x-auto overflow-y-hidden"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: '#10b981 #f1f5f9'
          }}
        >
          <div className="h-full" style={{ width: '200vw' }}></div>
        </div>
        <style>{`
          .fixed-scroll::-webkit-scrollbar {
            height: 12px;
          }
          .fixed-scroll::-webkit-scrollbar-track {
            background: #f1f5f9;
            border-radius: 6px;
          }
          .fixed-scroll::-webkit-scrollbar-thumb {
            background: linear-gradient(90deg, #10b981, #059669);
            border-radius: 6px;
            transition: all 0.2s ease;
          }
          .fixed-scroll::-webkit-scrollbar-thumb:hover {
            background: linear-gradient(90deg, #059669, #047857);
          }
        `}</style>
      </div>
    </div>
  );
};

export default DashboardPage;
