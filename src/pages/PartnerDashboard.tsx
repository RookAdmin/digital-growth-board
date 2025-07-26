
import { useEffect, useState } from 'react';
import { usePartnerAuth } from '@/hooks/usePartnerAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Calendar, Building, User, MapPin, LogOut } from 'lucide-react';
import { format } from 'date-fns';

interface PartnerProject {
  id: string;
  name: string;
  description: string | null;
  status: string;
  deadline: string | null;
  created_at: string;
  clients: {
    name: string;
    business_name: string | null;
  } | null;
  assigned_role: string | null;
  notes: string | null;
  assigned_at: string;
}

const PartnerDashboard = () => {
  const { partner, signOut } = usePartnerAuth();
  const [projects, setProjects] = useState<PartnerProject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPartnerProjects = async () => {
      if (!partner) return;

      try {
        const { data, error } = await supabase
          .from('partner_project_assignments')
          .select(`
            id,
            assigned_role,
            notes,
            assigned_at,
            projects:project_id (
              id,
              name,
              description,
              status,
              deadline,
              created_at,
              clients:client_id (
                name,
                business_name
              )
            )
          `)
          .eq('partner_id', partner.id);

        if (error) {
          console.error('Error fetching partner projects:', error);
        } else {
          const formattedProjects = data.map((assignment: any) => ({
            id: assignment.projects.id,
            name: assignment.projects.name,
            description: assignment.projects.description,
            status: assignment.projects.status,
            deadline: assignment.projects.deadline,
            created_at: assignment.projects.created_at,
            clients: assignment.projects.clients,
            assigned_role: assignment.assigned_role,
            notes: assignment.notes,
            assigned_at: assignment.assigned_at,
          }));
          setProjects(formattedProjects);
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPartnerProjects();
  }, [partner]);

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Not Started':
        return 'bg-gray-100 text-gray-800';
      case 'In Progress':
        return 'bg-blue-100 text-blue-800';
      case 'Review':
        return 'bg-yellow-100 text-yellow-800';
      case 'Completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const activeProjects = projects.filter(p => p.status !== 'Completed').length;

  const handleSignOut = async () => {
    await signOut();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-2xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Partner Dashboard</h1>
              <p className="text-gray-600">Welcome back, {partner?.full_name}</p>
            </div>
            <Button variant="outline" onClick={handleSignOut} className="flex items-center gap-2">
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeProjects}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{projects.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Service Categories</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {partner?.service_categories?.length || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Projects */}
        <Card>
          <CardHeader>
            <CardTitle>My Assigned Projects</CardTitle>
          </CardHeader>
          <CardContent>
            {projects.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <Building className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No projects assigned yet</h3>
                <p className="text-gray-500">You'll see your assigned projects here once they're available.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {projects.map((project) => (
                  <div key={project.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <Link
                          to={`/partner/projects/${project.id}`}
                          className="text-lg font-medium text-gray-900 hover:text-blue-600"
                        >
                          {project.name}
                        </Link>
                        <p className="text-sm text-gray-600 mt-1">
                          Client: {project.clients?.name || 'Unknown'}
                          {project.clients?.business_name && (
                            <span className="text-gray-400"> • {project.clients.business_name}</span>
                          )}
                        </p>
                      </div>
                      <Badge className={getStatusBadgeClass(project.status)}>
                        {project.status}
                      </Badge>
                    </div>
                    
                    {project.description && (
                      <p className="text-gray-600 mb-3 line-clamp-2">{project.description}</p>
                    )}
                    
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center gap-4">
                        {project.assigned_role && (
                          <span className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            Role: {project.assigned_role}
                          </span>
                        )}
                        {project.deadline && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            Due: {format(new Date(project.deadline), 'MMM d, yyyy')}
                          </span>
                        )}
                      </div>
                      <span>
                        Assigned: {format(new Date(project.assigned_at), 'MMM d, yyyy')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PartnerDashboard;
