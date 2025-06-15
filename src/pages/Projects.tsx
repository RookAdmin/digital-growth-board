
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/Header';
import { ProjectsTable } from '@/components/ProjectsTable';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { Project } from '@/types';

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
      <div className="flex flex-col h-screen bg-background">
        <Header isAuthenticated={true} />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-2xl">Loading projects...</div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <Header isAuthenticated={true} />
      <main className="flex-1 overflow-hidden">
        <div className="p-6 h-full flex flex-col">
          <div className="mb-6">
            <h1 className="text-3xl font-bold tracking-tight">Projects Dashboard</h1>
            <p className="text-muted-foreground">Manage and track all client projects.</p>
          </div>

          <div className="flex gap-4 mb-6">
            <Input
              placeholder="Search projects, clients, or descriptions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Not Started">Not Started</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Review">Review</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={clientFilter} onValueChange={setClientFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by client" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Clients</SelectItem>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.business_name || client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 overflow-hidden">
            <ProjectsTable projects={filteredProjects} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProjectsPage;
