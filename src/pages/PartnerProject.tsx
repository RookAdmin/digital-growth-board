import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CalendarIcon, UserIcon, ClockIcon } from 'lucide-react';
import { usePartnerAuth } from '@/hooks/usePartnerAuth';
import { format } from 'date-fns';
import { pillClasses } from '@/constants/palette';
import { PartnerHeader } from '@/components/PartnerHeader';
import { PartnerDock } from '@/components/PartnerDock';
import { LoadingState } from '@/components/LoadingState';

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
      <div className="min-h-screen bg-gradient-to-br from-[#f7f4ef] via-[#f4f1ff] to-[#eef7ff] pb-32">
        <PartnerHeader />
        <div className="max-w-5xl mx-auto px-4 py-16">
          <LoadingState message="Loading project details..." fullHeight />
        </div>
        <PartnerDock />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f7f4ef] via-[#f4f1ff] to-[#eef7ff] pb-32">
        <PartnerHeader />
        <div className="max-w-4xl mx-auto px-4 py-16">
          <div className="rounded-3xl border border-white/70 bg-white/90 p-10 text-center shadow-[0_25px_80px_rgba(15,23,42,0.15)]">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Project not found</h2>
            <p className="text-gray-500">We couldn’t locate this assignment. Please head back to your dashboard.</p>
            <Button
              className="mt-6 rounded-full bg-gray-900 text-white hover:bg-black"
              onClick={() => window.history.back()}
            >
              Return
            </Button>
          </div>
        </div>
        <PartnerDock />
      </div>
    );
  }

  const projectData = project.projects as any;
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return pillClasses.soft;
      case 'in progress':
        return pillClasses.dark;
      case 'on hold':
        return pillClasses.charcoal;
      default:
        return pillClasses.light;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return pillClasses.dark;
      case 'medium':
        return pillClasses.charcoal;
      case 'low':
        return pillClasses.light;
      default:
        return pillClasses.light;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f7f4ef] via-[#f4f1ff] to-[#eef7ff] pb-32">
      <PartnerHeader />
      <div className="max-w-5xl mx-auto px-4 py-10 space-y-6">
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
                  <div className="mt-6 p-4 bg-[#F1F1F1] rounded-lg">
                    <h4 className="font-medium text-[#131313] mb-2">Admin Notes</h4>
                    <p className="text-[#222222]">{project.notes}</p>
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
      <PartnerDock />
    </div>
  );
};

export default PartnerProject;
