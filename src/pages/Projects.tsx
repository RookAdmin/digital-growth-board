
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: teamMember } = await supabase
        .from('team_members')
        .select('role, id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      // Developer and Project Manager: only fetch assigned projects
      if (teamMember?.role === 'Developer' || teamMember?.role === 'Project Manager') {
        const { data: assignedProjects, error: assignError } = await supabase
          .from('team_member_projects')
          .select(`
            project_id,
            projects (
              *,
              clients(id, name, email, business_name),
              tasks(id, title, status)
            )
          `)
          .eq('team_member_id', teamMember.id);

        if (assignError) throw assignError;
        
        return (assignedProjects?.map(ap => ap.projects).filter(Boolean) || []) as Project[];
      }

      // CEO, CTO, SME, Client Executive: fetch all projects
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
        
        <div className="flex flex-col sm:flex-row gap-4 mb-6 p-4 bg-white rounded-lg border border-gray-200">
          <div className="flex-1 flex gap-4">
            <div className="flex-1">
              <FilterBar
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                searchPlaceholder="Search projects by name, description, client, or status..."
                startDate={startDate}
                endDate={endDate}
                singleDate={singleDate}
                onDateRangeChange={handleDateRangeChange}
                onSingleDateChange={handleSingleDateChange}
                showDateFilter={false}
              />
            </div>
            <div className="flex-shrink-0">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-10 px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
                style={{ backgroundColor: '#374151', color: 'white' }}
              >
                <option value="" style={{ backgroundColor: '#374151', color: 'white' }}>All Status</option>
                <option value="Not Started" style={{ backgroundColor: '#374151', color: 'white' }}>Not Started</option>
                <option value="In Progress" style={{ backgroundColor: '#374151', color: 'white' }}>In Progress</option>
                <option value="Review" style={{ backgroundColor: '#374151', color: 'white' }}>Review</option>
                <option value="Completed" style={{ backgroundColor: '#374151', color: 'white' }}>Completed</option>
              </select>
            </div>
          </div>
          
          <div className="flex gap-2 items-center">
            <FilterBar
              searchTerm=""
              onSearchChange={() => {}}
              showDateFilter={true}
              startDate={startDate}
              endDate={endDate}
              singleDate={singleDate}
              onDateRangeChange={handleDateRangeChange}
              onSingleDateChange={handleSingleDateChange}
            />
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
