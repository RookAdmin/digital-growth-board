
import { useEffect, useState } from "react";
import { Header } from '@/components/Header';
import { ClientsTable } from '@/components/ClientsTable';
import { DockNav } from '@/components/DockNav';
import { PageHero } from '@/components/PageHero';
import { SearchInput } from '@/components/SearchInput';
import { UnifiedDateFilter } from '@/components/UnifiedDateFilter';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';

const ClientsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [singleDate, setSingleDate] = useState<Date | undefined>();
  const [statusFilter, setStatusFilter] = useState('all');

  const hasActiveFilters =
    Boolean(searchTerm || startDate || endDate || singleDate) || statusFilter !== 'all';

  const statusOptions = [
    { label: "All journeys", value: "all" },
    { label: "Onboarding", value: "onboarding" },
    { label: "Active", value: "active" },
    { label: "Paused / Dormant", value: "paused" },
    { label: "Completed", value: "completed" },
  ];
  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setStartDate(undefined);
    setEndDate(undefined);
    setSingleDate(undefined);
  };


  useEffect(() => {
    document.title = "Clients - Rook";
  }, []);

  const handleDateRangeChange = (start?: Date, end?: Date) => {
    setStartDate(start);
    setEndDate(end);
  };

  const handleSingleDateChange = (date?: Date) => {
    setSingleDate(date);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f7f4ef] via-[#f4f1ff] to-[#eef7ff] pb-32">
      <Header isAuthenticated={true} />
      
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8">
        <PageHero
          title="Clients"
          description="Every relationship in one modern view—keep momentum, context, and communication flowing."
        />
        
        <section className="rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-[0_20px_70px_rgba(15,23,42,0.08)] backdrop-blur space-y-6">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-[0.3em] text-gray-400">Search</label>
              <div className="rounded-2xl border border-gray-200 bg-white px-4 py-2.5 shadow-inner shadow-white/40">
                <SearchInput
                  value={searchTerm}
                  onChange={setSearchTerm}
                  placeholder="Search name, email, phone, business"
                  className="border-none bg-transparent focus-visible:ring-0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs uppercase tracking-[0.3em] text-gray-400">Journey</label>
              <div className="relative rounded-2xl border border-gray-200 bg-white px-4 py-2.5">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full appearance-none bg-transparent text-sm font-medium text-gray-900 focus:outline-none"
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="text-sm text-gray-500">
              Refine by conversion date or specific day.
            </div>
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
              <UnifiedDateFilter
                startDate={startDate}
                endDate={endDate}
                singleDate={singleDate}
                onDateRangeChange={handleDateRangeChange}
                onSingleDateChange={handleSingleDateChange}
              />
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearFilters}
                  className="rounded-full text-gray-600 hover:text-gray-900"
                >
                  Reset filters
                </Button>
              )}
            </div>
          </div>
        </section>
        
        <section className="rounded-[32px] border border-white/80 bg-white shadow-[0_20px_80px_rgba(15,23,42,0.08)] overflow-hidden animate-in fade-in duration-500">
          <ClientsTable 
            searchTerm={searchTerm}
            startDate={startDate}
            endDate={endDate}
            singleDate={singleDate}
            statusFilter={statusFilter}
          />
        </section>
      </main>
      <DockNav />
    </div>
  );
};

export default ClientsPage;
