import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, User, Mail, Phone, Building, Calendar, FolderOpen, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { Client, Project } from '@/types';

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Not Started':
      return 'bg-slate-100 text-slate-700 border-slate-200';
    case 'In Progress':
      return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'Review':
      return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'Completed':
      return 'bg-green-100 text-green-700 border-green-200';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
};

const ClientDetails = () => {
  const { id } = useParams<{ id: string }>();
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
        .single();
      
      if (error) throw error;
      return data as Client;
    },
    enabled: !!id,
  });

  const { data: projects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ['client-projects', id],
    queryFn: async () => {
      if (!id) return [];
      
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          tasks(id, status)
        `)
        .eq('client_id', id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Project[];
    },
    enabled: !!id,
  });

  if (clientLoading) {
    return (
      <div className="min-h-screen bg-white">
        <Header isAuthenticated={true} />
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-gray-500">Loading client details...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-screen bg-white">
        <Header isAuthenticated={true} />
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Client Not Found</h3>
              <p className="text-gray-500 mb-4">The client you're looking for doesn't exist or has been deleted.</p>
              <Button onClick={() => navigate('/clients')} variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Clients
              </Button>
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
        {/* Header */}
        <div className="mb-6">
          <Button 
            variant="outline" 
            onClick={() => navigate('/clients')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Clients
          </Button>
          
          <div className="flex items-start justify-between mb-2">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-black">{client.name}</h1>
              <p className="text-sm sm:text-base lg:text-lg text-gray-600 mt-1 font-light">
                Client details and associated projects
              </p>
            </div>
            <Badge className={`${client.onboarding_status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'} text-sm font-medium px-3 py-1 rounded-full`} variant="outline">
              {client.onboarding_status}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Client Information */}
            <Card>
              <CardHeader>
                <CardTitle>Client Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <User className="w-4 h-4 text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-500">Full Name</div>
                      <div className="font-medium">{client.name}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-500">Email</div>
                      <div className="font-medium">{client.email}</div>
                    </div>
                  </div>
                  
                  {client.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <div>
                        <div className="text-sm text-gray-500">Phone</div>
                        <div className="font-medium">{client.phone}</div>
                      </div>
                    </div>
                  )}
                  
                  {client.business_name && (
                    <div className="flex items-center gap-3">
                      <Building className="w-4 h-4 text-gray-400" />
                      <div>
                        <div className="text-sm text-gray-500">Business</div>
                        <div className="font-medium">{client.business_name}</div>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-500">Client Since</div>
                      <div className="font-medium">{format(new Date(client.created_at), 'PPP')}</div>
                    </div>
                  </div>
                </div>
                
                {client.services_interested && client.services_interested.length > 0 && (
                  <div>
                    <div className="text-sm text-gray-500 mb-2">Services Interested</div>
                    <div className="flex flex-wrap gap-2">
                      {client.services_interested.map((service, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {service}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {client.budget_range && (
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Budget Range</div>
                    <div className="font-medium">{client.budget_range}</div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Projects */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FolderOpen className="w-5 h-5" />
                  Projects
                  <Badge variant="secondary">
                    {projects.length} total
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {projectsLoading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-black mx-auto"></div>
                  </div>
                ) : projects.length > 0 ? (
                  <div className="space-y-4">
                    {projects.map((project) => (
                      <div key={project.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50 hover:shadow-sm transition-shadow">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h5 className="font-medium text-gray-900">{project.name}</h5>
                              <Badge className={`${getStatusColor(project.status)} text-xs`} variant="outline">
                                {project.status}
                              </Badge>
                            </div>
                            {project.description && (
                              <p className="text-sm text-gray-600 mb-2">{project.description}</p>
                            )}
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span>Created: {format(new Date(project.created_at), 'MMM dd, yyyy')}</span>
                              {project.deadline && (
                                <span>Deadline: {format(new Date(project.deadline), 'MMM dd, yyyy')}</span>
                              )}
                              {project.tasks && (
                                <span>Tasks: {project.tasks.filter(t => t.status === 'Completed').length}/{project.tasks.length}</span>
                              )}
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/project/${project.id}`)}
                            className="ml-4"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No projects assigned to this client yet.</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <FolderOpen className="w-4 h-4 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-500">Total Projects</div>
                    <div className="font-medium">{projects.length}</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-500 rounded-full" />
                  <div>
                    <div className="text-sm text-gray-500">Completed Projects</div>
                    <div className="font-medium">{projects.filter(p => p.status === 'Completed').length}</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-500 rounded-full" />
                  <div>
                    <div className="text-sm text-gray-500">Active Projects</div>
                    <div className="font-medium">{projects.filter(p => p.status === 'In Progress').length}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ClientDetails;