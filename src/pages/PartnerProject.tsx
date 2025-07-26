import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CalendarIcon, FileIcon, UserIcon, ClockIcon, CheckCircleIcon } from 'lucide-react';
import { usePartnerAuth } from '@/hooks/usePartnerAuth';
import { format } from 'date-fns';

const PartnerProject = () => {
  const { id } = useParams<{ id: string }>();
  const { partner } = usePartnerAuth();

  const { data: project, isLoading } = useQuery({
    queryKey: ['partner-project', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('partner_project_assignments')
        .select(`
          assigned_role,
          notes,
          assigned_at,
          projects:project_id (
            id,
            name,
            description,
            status,
            start_date,
            deadline,
            budget,
            clients:client_id (
              name,
              business_name,
              email
            ),
            project_tasks (
              id,
              title,
              description,
              status,
              priority,
              due_date,
              assigned_to
            )
          )
        `)
        .eq('partner_id', partner?.id)
        .eq('project_id', id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!partner?.id && !!id,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-2xl">Loading project details...</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl text-gray-600">Project not found</div>
      </div>
    );
  }

  const projectData = project.projects as any;
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in progress':
        return 'bg-blue-100 text-blue-800';
      case 'on hold':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container py-8">
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => window.history.back()}
            className="mb-4"
          >
            ← Back to Dashboard
          </Button>
          
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {projectData.name}
              </h1>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <UserIcon className="h-4 w-4" />
                  {projectData.clients?.name}
                </span>
                <span className="flex items-center gap-1">
                  <CalendarIcon className="h-4 w-4" />
                  Assigned: {format(new Date(project.assigned_at), 'MMM dd, yyyy')}
                </span>
              </div>
            </div>
            <Badge className={getStatusColor(projectData.status)}>
              {projectData.status}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Project Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Project Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed">
                  {projectData.description || 'No description available for this project.'}
                </p>
                
                {project.notes && (
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">Admin Notes</h4>
                    <p className="text-blue-800">{project.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tasks & Milestones */}
            <Card>
              <CardHeader>
                <CardTitle>Tasks & Milestones</CardTitle>
                <CardDescription>
                  Your assigned tasks for this project
                </CardDescription>
              </CardHeader>
              <CardContent>
                {projectData.project_tasks && projectData.project_tasks.length > 0 ? (
                  <div className="space-y-4">
                    {projectData.project_tasks.map((task: any) => (
                      <div key={task.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium text-gray-900">{task.title}</h4>
                          <div className="flex gap-2">
                            <Badge className={getStatusColor(task.status)}>
                              {task.status}
                            </Badge>
                            <Badge className={getPriorityColor(task.priority)}>
                              {task.priority}
                            </Badge>
                          </div>
                        </div>
                        {task.description && (
                          <p className="text-gray-600 text-sm mb-2">{task.description}</p>
                        )}
                        {task.due_date && (
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <ClockIcon className="h-4 w-4" />
                            Due: {format(new Date(task.due_date), 'MMM dd, yyyy')}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">
                    No tasks have been assigned yet.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Assignment Details */}
            <Card>
              <CardHeader>
                <CardTitle>Assignment Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {project.assigned_role && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Your Role</label>
                    <p className="text-gray-900">{project.assigned_role}</p>
                  </div>
                )}
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Client</label>
                  <p className="text-gray-900">{projectData.clients?.name}</p>
                  {projectData.clients?.business_name && (
                    <p className="text-sm text-gray-600">{projectData.clients.business_name}</p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Contact Email</label>
                  <p className="text-gray-900">{projectData.clients?.email}</p>
                </div>
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>Timeline</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {projectData.start_date && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Start Date</label>
                    <p className="text-gray-900">
                      {format(new Date(projectData.start_date), 'MMM dd, yyyy')}
                    </p>
                  </div>
                )}
                
                {projectData.deadline && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Deadline</label>
                    <p className="text-gray-900">
                      {format(new Date(projectData.deadline), 'MMM dd, yyyy')}
                    </p>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium text-gray-500">Assigned Date</label>
                  <p className="text-gray-900">
                    {format(new Date(project.assigned_at), 'MMM dd, yyyy')}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Budget */}
            {projectData.budget && (
              <Card>
                <CardHeader>
                  <CardTitle>Budget</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-gray-900">
                    ${projectData.budget?.toLocaleString()}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PartnerProject;
