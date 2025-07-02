
import { useEffect, useState } from "react";
import { Header } from '@/components/Header';
import { ProjectsTable } from '@/components/ProjectsTable';
import { FilterBar } from '@/components/FilterBar';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Project } from '@/types';

const ProjectsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [singleDate, setSingleDate] = useState<Date | undefined>();
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    document.title = "Projects - Rook";
  }, []);

  const handleDateRangeChange = (start?: Date, end?: Date) => {
    setStartDate(start);
    setEndDate(end);
  };

  const handleSingleDateChange = (date?: Date) => {
    setSingleDate(date);
  };

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          clients(id, name, email, business_name),
          tasks(id, title, status)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return (data || []) as Project[];
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <Header isAuthenticated={true} />
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-gray-500">Loading projects...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header isAuthenticated={true} />
      
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-black">Projects</h1>
          <p className="text-sm sm:text-base lg:text-lg text-gray-600 mt-1 font-light">Manage and track all your active projects.</p>
        </div>
        
        <div className="space-y-4">
          <FilterBar
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder="Search projects by name, description, client, or status..."
            startDate={startDate}
            endDate={endDate}
            singleDate={singleDate}
            onDateRangeChange={handleDateRangeChange}
            onSingleDateChange={handleSingleDateChange}
          />
          
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <div className="flex-1">
                <label className="text-sm font-medium text-gray-700 mb-2 block">Filter by Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full sm:w-48 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Status</option>
                  <option value="Not Started">Not Started</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Review">Review</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
              {statusFilter && (
                <button
                  onClick={() => setStatusFilter('')}
                  className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 underline"
                >
                  Clear Status Filter
                </button>
              )}
            </div>
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <ProjectsTable 
            projects={projects} 
            searchTerm={searchTerm}
            startDate={startDate}
            endDate={endDate}
            singleDate={singleDate}
            statusFilter={statusFilter}
          />
        </div>
      </main>
    </div>
  );
};

export default ProjectsPage;
