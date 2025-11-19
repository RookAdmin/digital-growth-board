
import { useEffect, useState } from "react";
import { Header } from '@/components/Header';
import { ProjectsTable } from '@/components/ProjectsTable';
import { DockNav } from '@/components/DockNav';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Project } from '@/types';
import { LoadingState } from '@/components/LoadingState';
import { ChevronDown } from "lucide-react";
import { PageHero } from "@/components/PageHero";
import { SearchInput } from '@/components/SearchInput';
import { UnifiedDateFilter } from '@/components/UnifiedDateFilter';
import { Button } from '@/components/ui/button';

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
      <div className="min-h-screen bg-[#FAF9F6] pb-32">
        <Header isAuthenticated={true} />
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <LoadingState message="Loading projects..." fullHeight />
        </main>
        <DockNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f7f4ef] via-[#f4f1ff] to-[#eef7ff] pb-32">
      <Header isAuthenticated={true} />
      
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6">
        <PageHero
          title="Projects"
          description="Track delivery, approvals, and impact across every engagement."
        />
        
        <section className="rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-[0_20px_70px_rgba(15,23,42,0.08)] backdrop-blur space-y-6">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-[0.3em] text-gray-400">Search</label>
              <div className="rounded-2xl border border-gray-200 bg-white px-4 py-2.5 shadow-inner shadow-white/40">
                <SearchInput
                  value={searchTerm}
                  onChange={setSearchTerm}
                  placeholder="Search name, description, client, status"
                  className="border-none bg-transparent focus-visible:ring-0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs uppercase tracking-[0.3em] text-gray-400">Status</label>
              <div className="relative rounded-2xl border border-gray-200 bg-white px-4 py-2.5">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full appearance-none bg-transparent text-sm font-medium text-gray-900 focus:outline-none"
                >
                  <option value="">All Status</option>
                  <option value="Not Started">Not Started</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Review">Review</option>
                  <option value="Completed">Completed</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="text-sm text-gray-500">
              Refine by creation date or specific day.
            </div>
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
              <UnifiedDateFilter
                startDate={startDate}
                endDate={endDate}
                singleDate={singleDate}
                onDateRangeChange={handleDateRangeChange}
                onSingleDateChange={handleSingleDateChange}
              />
              {(statusFilter || searchTerm || startDate || endDate || singleDate) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setStatusFilter('');
                    setSearchTerm('');
                    setStartDate(undefined);
                    setEndDate(undefined);
                    setSingleDate(undefined);
                  }}
                  className="rounded-full text-gray-600 hover:text-gray-900"
                >
                  Reset filters
                </Button>
              )}
            </div>
          </div>
        </section>
        
        <div className="rounded-[32px] border border-white/80 bg-white shadow-[0_25px_90px_rgba(15,23,42,0.08)] overflow-hidden animate-in fade-in duration-500">
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
      <DockNav />
    </div>
  );
};

export default ProjectsPage;
