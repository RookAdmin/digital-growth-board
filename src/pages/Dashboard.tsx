
import { KanbanBoard } from '@/components/KanbanBoard';
import { Header } from '@/components/Header';
import { AddLeadDialog } from '@/components/AddLeadDialog';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ChartBarIncreasing, Calendar, X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';

const DashboardPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<Date | undefined>(undefined);

  return (
    <div className="flex flex-col h-screen bg-background">
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
              />
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-[200px] justify-start text-left font-normal">
                    <Calendar className="mr-2 h-4 w-4" />
                    {dateFilter ? format(dateFilter, 'MMM dd, yyyy') : 'Filter by date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={dateFilter}
                    onSelect={setDateFilter}
                    initialFocus
                  />
                  {dateFilter && (
                    <div className="p-3 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDateFilter(undefined)}
                        className="w-full"
                      >
                        <X className="mr-2 h-4 w-4" />
                        Clear filter
                      </Button>
                    </div>
                  )}
                </PopoverContent>
              </Popover>

              <Link to="/dashboard/reporting">
                <Button variant="outline">
                  <ChartBarIncreasing className="mr-2 h-4 w-4" />
                  View Reports
                </Button>
              </Link>
              <AddLeadDialog />
            </div>
          </div>
          <KanbanBoard searchTerm={searchTerm} dateFilter={dateFilter} />
      </main>
    </div>
  );
};

export default DashboardPage;
