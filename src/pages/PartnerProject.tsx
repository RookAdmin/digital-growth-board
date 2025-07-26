
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { usePartnerAuth } from '@/hooks/usePartnerAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, User, Building, FileText, Target } from 'lucide-react';
import { format } from 'date-fns';

interface ProjectDetails {
  id: string;
  name: string;
  description: string | null;
  status: string;
  deadline: string | null;
  created_at: string;
  clients: {
    name: string;
    email: string;
    business_name: string | null;
  } | null;
  assigned_role: string | null;
  notes: string | null;
  assigned_at: string;
  tasks: Array<{
    id: string;
    title: string;
    description: string | null;
    status: string;
    priority: string;
    due_date: string | null;
    type: string;
  }>;
}

const PartnerProject = () => {
  const { id } = useParams();
  const { partner } = usePartnerAuth();
  const [project, setProject] = useState<ProjectDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjectDetails = async () => {
      if (!partner || !id) return;

      try {
        // First check if partner is assigned to this project
        const { data: assignment } = await supabase
          .from('partner_project_assignments')
          .select('assigned_role, notes, assigned_at')
          .eq('partner_id', partner.id)
          .eq('project_id', id)
          .single();

        if (!assignment) {
          setProject(null);
          return;
        }

        // Fetch full project details
        const { data: projectData, error } = await supabase
          .from('projects')
          .select(`
            id,
            name,
            description,
            status,
            deadline,
            created_at,
            clients:client_id (
              name,
              email,
              business_name
            ),
            tasks (
              id,
              title,
              description,
              status,
              priority,
              due_date,
              type
            )
          `)
          .eq('id', id)
          .single();

        if (error) {
          console.error('Error fetching project:', error);
        } else {
          setProject({
            ...projectData,
            assigned_role: assignment.assigned_role,
            notes: assignment.notes,
            assigned_at: assignment.assigned_at,
          });
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjectDetails();
  }, [partner, id]);

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
      case 'Blocked':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityBadgeClass = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-blue-100 text-blue-800';
      case 'low':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-2xl">Loading...</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Project Not Found</h2>
          <p className="text-gray-600 mb-4">You don't have access to this project.</p>
          <Link to="/partner/dashboard">
            <Button>Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  const milestones = project.tasks?.filter(task => task.type === 'milestone') || [];
  const regularTasks = project.tasks?.filter(task => task.type === 'task') || [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-4">
              <Link to="/partner/dashboard">
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
                <p className="text-gray-600">Project Details</p>
              </div>
            </div>
            <Badge className={getStatusBadgeClass(project.status)}>
              {project.status}
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Project Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Project Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                {project.description ? (
                  <p className="text-gray-700 whitespace-pre-line">{project.description}</p>
                ) : (
                  <p className="text-gray-500 italic">No description available</p>
                )}
              </CardContent>
            </Card>

            {/* Milestones */}
            {milestones.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Milestones
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {milestones.map((milestone) => (
                      <div key={milestone.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium">{milestone.title}</h4>
                          <Badge className={getStatusBadgeClass(milestone.status)}>
                            {milestone.status}
                          </Badge>
                        </div>
                        {milestone.description && (
                          <p className="text-gray-600 text-sm mb-2">{milestone.description}</p>
                        )}
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <Badge className={getPriorityBadgeClass(milestone.priority)}>
                            {milestone.priority}
                          </Badge>
                          {milestone.due_date && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              Due: {format(new Date(milestone.due_date), 'MMM d, yyyy')}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Tasks */}
            {regularTasks.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Tasks</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {regularTasks.map((task) => (
                      <div key={task.id} className="border rounded-lg p-3">
                        <div className="flex items-start justify-between mb-2">
                          <h5 className="font-medium text-sm">{task.title}</h5>
                          <Badge className={getStatusBadgeClass(task.status)} size="sm">
                            {task.status}
                          </Badge>
                        </div>
                        {task.description && (
                          <p className="text-gray-600 text-sm mb-2">{task.description}</p>
                        )}
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <Badge className={getPriorityBadgeClass(task.priority)} size="sm">
                            {task.priority}
                          </Badge>
                          {task.due_date && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(task.due_date), 'MMM d')}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Client Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Client Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">Client Name</label>
                  <p className="text-gray-900">{project.clients?.name || 'Unknown'}</p>
                </div>
                {project.clients?.business_name && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Business</label>
                    <p className="text-gray-900">{project.clients.business_name}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-gray-500">Email</label>
                  <p className="text-gray-900">{project.clients?.email || 'Not provided'}</p>
                </div>
              </CardContent>
            </Card>

            {/* Assignment Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Assignment Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {project.assigned_role && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Your Role</label>
                    <p className="text-gray-900">{project.assigned_role}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-gray-500">Assigned Date</label>
                  <p className="text-gray-900">
                    {format(new Date(project.assigned_at), 'MMM d, yyyy')}
                  </p>
                </div>
                {project.deadline && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Deadline</label>
                    <p className="text-gray-900">
                      {format(new Date(project.deadline), 'MMM d, yyyy')}
                    </p>
                  </div>
                )}
                {project.notes && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Assignment Notes</label>
                    <p className="text-gray-700 text-sm whitespace-pre-line">{project.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PartnerProject;
