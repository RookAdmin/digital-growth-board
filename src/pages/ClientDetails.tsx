import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, FolderOpen, Calendar, DollarSign, Users } from 'lucide-react';
import { format } from 'date-fns';
import { DockNav } from '@/components/DockNav';
import { LoadingState } from '@/components/LoadingState';
import { pillClasses } from '@/constants/palette';

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Not Started':
      return pillClasses.light;
    case 'In Progress':
      return pillClasses.dark;
    case 'Review':
      return pillClasses.charcoal;
    case 'Completed':
      return pillClasses.soft;
    default:
      return pillClasses.light;
  }
};

const ClientDetails = () => {
  const { workspaceId, id } = useParams<{ workspaceId: string; id: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Client Details - Rook";
  }, []);

  const { data: client, isLoading: clientLoading } = useQuery({
    queryKey: ['client', id],
    queryFn: async () => {
      if (!id) throw new Error('Client ID is required');
      
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ['client-projects', id],
    queryFn: async () => {
      if (!id) throw new Error('Client ID is required');
      
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('client_id', id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const isLoading = clientLoading || projectsLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] pb-32">
        <Header isAuthenticated={true} />
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <LoadingState message="Loading client details..." fullHeight />
        </main>
        <DockNav />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] pb-32">
        <Header isAuthenticated={true} />
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Client Not Found</h3>
              <p className="text-gray-500 mb-4">The client you're looking for doesn't exist or has been deleted.</p>
              <Button onClick={() => navigate(workspaceId ? `/clients/${workspaceId}` : '/clients')} variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Clients
              </Button>
            </div>
          </div>
        </main>
        <DockNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] pb-32">
      <Header isAuthenticated={true} />
      
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6">
          <Button 
            variant="outline" 
            onClick={() => navigate(workspaceId ? `/clients/${workspaceId}` : '/clients')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Clients
          </Button>
          
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-black">
              {client.name}
            </h1>
            <p className="text-sm sm:text-base lg:text-lg text-gray-600 mt-1 font-light">
              Client details and projects
            </p>
          </div>

          {/* Client Info Card */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Client Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Email</h4>
                  <p className="text-gray-600">{client.email}</p>
                </div>
                {client.phone && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Phone</h4>
                    <p className="text-gray-600">{client.phone}</p>
                  </div>
                )}
                {client.business_name && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Business Name</h4>
                    <p className="text-gray-600">{client.business_name}</p>
                  </div>
                )}
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Onboarding Status</h4>
                  <Badge variant="secondary">{client.onboarding_status}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Projects Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FolderOpen className="w-5 h-5" />
                Projects
                {projects && projects.length > 0 && (
                  <Badge variant="secondary">{projects.length}</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {projects && projects.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {projects.map((project: any) => (
                    <Card 
                      key={project.id}
                      className="cursor-pointer hover:shadow-md transition-shadow border-gray-200"
                      onClick={() => navigate(workspaceId ? `/projects/${workspaceId}/${project.id}` : `/projects/${project.id}`)}
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-lg">{project.name}</CardTitle>
                          <Badge className={`${getStatusColor(project.status)} text-xs font-medium px-2 py-1 rounded-full`} variant="outline">
                            {project.status}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {project.description && (
                          <p className="text-sm text-gray-600 line-clamp-2">{project.description}</p>
                        )}
                        <div className="space-y-2 text-sm">
                          {project.deadline && (
                            <div className="flex items-center gap-2 text-gray-600">
                              <Calendar className="w-4 h-4" />
                              <span>Due: {format(new Date(project.deadline), 'MMM dd, yyyy')}</span>
                            </div>
                          )}
                          {project.budget && (
                            <div className="flex items-center gap-2 text-gray-600">
                              <DollarSign className="w-4 h-4" />
                              <span>${project.budget.toLocaleString()}</span>
                            </div>
                          )}
                          {project.assigned_team_members && project.assigned_team_members.length > 0 && (
                            <div className="flex items-center gap-2 text-gray-600">
                              <Users className="w-4 h-4" />
                              <span>{project.assigned_team_members.length} team members</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FolderOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 mb-2">No projects assigned to this client yet.</p>
                  <Button onClick={() => navigate(workspaceId ? `/projects/${workspaceId}` : '/projects')} variant="outline">
                    View All Projects
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      <DockNav />
    </div>
  );
};

export default ClientDetails;
