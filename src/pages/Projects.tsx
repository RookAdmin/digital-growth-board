
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/Header';
import { ProjectsTable } from '@/components/ProjectsTable';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { Project } from '@/types';
import { Search, Filter } from 'lucide-react';

const ProjectsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [clientFilter, setClientFilter] = useState<string>('all');

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          clients (
            name,
            email,
            business_name
          ),
          tasks (
            id,
            status
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Project[];
    }
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients-for-filter'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('id, name, business_name')
        .order('name');

      if (error) throw error;
      return data;
    }
  });

  const filteredProjects = projects.filter(project => {
    const matchesSearch = 
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.clients?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.clients?.business_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    const matchesClient = clientFilter === 'all' || project.client_id === clientFilter;

    return matchesSearch && matchesStatus && matchesClient;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <Header isAuthenticated={true} />
        <main className="flex items-center justify-center min-h-[60vh] p-4">
          <div className="modern-card p-6 sm:p-8 max-w-sm w-full mx-auto">
            <div className="flex flex-col items-center gap-4">
              <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
              <div className="text-base sm:text-lg font-medium text-gray-700 text-center">Loading projects...</div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <Header isAuthenticated={true} />
      
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight mb-2 text-gray-900">Projects Dashboard</h1>
          <p className="text-sm sm:text-base lg:text-lg text-gray-600 font-light">Manage and track all client projects</p>
        </div>

        <div className="modern-card p-4 sm:p-6 lg:p-8 mb-6">
          <div className="flex flex-col gap-4 sm:gap-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              <div className="relative col-span-1 sm:col-span-2 lg:col-span-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search projects, clients..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 modern-input border-0 bg-white/60 backdrop-blur-sm shadow-sm focus:shadow-md transition-all duration-300 h-10 sm:h-11"
                />
              </div>
              
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="pl-10 modern-input border-0 bg-white/60 backdrop-blur-sm shadow-sm h-10 sm:h-11">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent className="modern-card border-0 shadow-xl">
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="Not Started">Not Started</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Review">Review</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Select value={clientFilter} onValueChange={setClientFilter}>
                <SelectTrigger className="modern-input border-0 bg-white/60 backdrop-blur-sm shadow-sm h-10 sm:h-11">
                  <SelectValue placeholder="All Clients" />
                </SelectTrigger>
                <SelectContent className="modern-card border-0 shadow-xl">
                  <SelectItem value="all">All Clients</SelectItem>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.business_name || client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="modern-card overflow-hidden">
          <ProjectsTable projects={filteredProjects} />
        </div>
      </main>
    </div>
  );
};

export default ProjectsPage;
