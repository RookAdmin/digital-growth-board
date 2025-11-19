import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Calendar, DollarSign, Users, CheckSquare, FolderOpen, Plus, MessageSquare, Upload, Activity, Edit } from 'lucide-react';
import { format } from 'date-fns';
import { Project, Task } from '@/types';
import { AddTaskForm } from '@/components/AddTaskForm';
import { ProjectFileManager } from '@/components/ProjectFileManager';
import { ProjectMessaging } from '@/components/ProjectMessaging';
import { ProjectActivityLog } from '@/components/ProjectActivityLog';
import { ProjectTeamManager } from '@/components/ProjectTeamManager';
import { EditTaskDialog } from '@/components/EditTaskDialog';
import { pillClasses } from '@/constants/palette';
import { DockNav } from '@/components/DockNav';
import { LoadingState } from '@/components/LoadingState';

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

const ProjectDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showAddTask, setShowAddTask] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);

  useEffect(() => {
    document.title = "Project Details - Rook";
  }, []);

  const { data: project, isLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: async () => {
      if (!id) throw new Error('Project ID is required');
      
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          clients(id, name, email, business_name)
        `)
        .eq('id', id)
        .maybeSingle();
      
      if (error) throw error;

      // Fetch tasks separately
      const { data: tasks } = await supabase
        .from('tasks')
        .select('*')
        .eq('project_id', id);

      // Fetch team members separately
      const { data: teamMembers } = await supabase
        .from('team_members')
        .select('id, name, email, role')
        .in('id', data?.assigned_team_members || []);
      
      return data ? { ...data, tasks: tasks || [], team_members: teamMembers || [] } as any : null;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] pb-32">
        <Header isAuthenticated={true} />
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <LoadingState message="Loading project details..." fullHeight />
        </main>
        <DockNav />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] pb-32">
        <Header isAuthenticated={true} />
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <FolderOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Project Not Found</h3>
              <p className="text-gray-500 mb-4">The project you're looking for doesn't exist or has been deleted.</p>
              <Button onClick={() => navigate('/projects')} variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Projects
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
            onClick={() => navigate('/projects')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Projects
          </Button>
          
          <div className="flex items-start justify-between mb-2">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-black">{project.name}</h1>
              <p className="text-sm sm:text-base lg:text-lg text-gray-600 mt-1 font-light">
                Project details and status overview
              </p>
            </div>
            <Badge className={`${getStatusColor(project.status)} text-sm font-medium px-3 py-1 rounded-full`} variant="outline">
              {project.status}
            </Badge>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="files">Files</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              <TabsContent value="overview" className="space-y-6">
                {/* Project Overview */}
                <Card>
                  <CardHeader>
                    <CardTitle>Project Overview</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {project.description && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                        <p className="text-gray-600">{project.description}</p>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-1">Client</h4>
                        <div className="text-gray-600">
                          <div>{project.clients?.business_name || project.clients?.name}</div>
                          <div className="text-sm">{project.clients?.email}</div>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-gray-900 mb-1">Created</h4>
                        <p className="text-gray-600">{format(new Date(project.created_at), 'PPP')}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Team Management */}
                <ProjectTeamManager 
                  projectId={id!} 
                  assignedTeamMembers={project.assigned_team_members || []} 
                />
              </TabsContent>

              <TabsContent value="tasks" className="space-y-6">
                {/* Add Task Form */}
                {showAddTask && (
                  <AddTaskForm 
                    projectId={id!} 
                    onCancel={() => setShowAddTask(false)} 
                  />
                )}

                {/* Tasks */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <CheckSquare className="w-5 h-5" />
                        Tasks
                        {project.tasks && (
                          <Badge variant="secondary">
                            {project.tasks.filter(t => t.status === 'Completed').length}/{project.tasks.length} completed
                          </Badge>
                        )}
                      </CardTitle>
                      <Button onClick={() => setShowAddTask(true)} size="sm">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Task
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {project.tasks && project.tasks.length > 0 ? (
                      <div className="space-y-3">
                        {project.tasks.map((task: any) => (
                          <div key={task.id} className="border border-gray-200 rounded-lg">
                            <div className="flex items-start gap-3 p-3">
                              <div className={`w-2 h-2 rounded-full mt-2 ${
                                task.status === 'Completed' ? 'bg-[#131313]' : 
                                task.status === 'In Progress' ? 'bg-[#222222]' : 'bg-[#F1F1F1]'
                              }`} />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start gap-2">
                                  <h5 className="font-medium text-gray-900">{task.title}</h5>
                                  <Badge variant="outline" className="text-xs">
                                    {task.type}
                                  </Badge>
                                </div>
                                {task.description && (
                                  <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                                )}
                                {task.description_image_url && (
                                  <img 
                                    src={task.description_image_url} 
                                    alt="Task description" 
                                    className="mt-2 max-w-xs rounded border"
                                  />
                                )}
                                {task.remarks && (
                                  <div className="mt-2">
                                    <span className="text-xs font-medium text-gray-700">Remarks: </span>
                                    <span className="text-sm text-gray-600">{task.remarks}</span>
                                  </div>
                                )}
                                {task.remarks_image_url && (
                                  <img 
                                    src={task.remarks_image_url} 
                                    alt="Task remarks" 
                                    className="mt-2 max-w-xs rounded border"
                                  />
                                )}
                                <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                  <span>Status: {task.status}</span>
                                  {task.due_date && (
                                    <span>Due: {format(new Date(task.due_date), 'MMM dd, yyyy')}</span>
                                  )}
                                  {task.priority && (
                                    <span className={`px-2 py-1 rounded ${
                                      task.priority === 'high' || task.priority === 'urgent' ? 'bg-[#131313] text-[#FAF9F6]' :
                                      task.priority === 'medium' ? 'bg-[#222222] text-[#FAF9F6]' :
                                      'bg-[#F1F1F1] text-[#131313]'
                                    }`}>
                                      {task.priority}
                                    </span>
                                  )}
                                  {task.assigned_team_members && task.assigned_team_members.length > 0 && (
                                    <Badge variant="outline" className="text-xs">
                                      <Users className="w-3 h-3 mr-1" />
                                      {task.assigned_team_members.length} assigned
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setEditingTask(task)}
                                className="mt-1"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <CheckSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500 mb-2">No tasks assigned to this project yet.</p>
                        <Button onClick={() => setShowAddTask(true)} variant="outline">
                          <Plus className="w-4 h-4 mr-2" />
                          Add First Task
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="files" className="space-y-6">
                <ProjectFileManager projectId={id!} projectName={project.name} />
              </TabsContent>

              <TabsContent value="messages" className="space-y-6">
                <ProjectMessaging projectId={id!} />
              </TabsContent>

              <TabsContent value="activity" className="space-y-6">
                <ProjectActivityLog projectId={id!} />
              </TabsContent>
            </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Project Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Project Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {project.deadline && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-500">Deadline</div>
                      <div className="font-medium">{format(new Date(project.deadline), 'PPP')}</div>
                    </div>
                  </div>
                )}

                {project.budget && (
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-500">Budget</div>
                      <div className="font-medium">${project.budget.toLocaleString()}</div>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-gray-400" />
                <div>
                  <div className="text-sm text-gray-500">Team Members</div>
                  <div className="font-medium">{project.assigned_team_members?.length || 0}</div>
                </div>
                </div>

                <div className="flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-500">Tasks</div>
                    <div className="font-medium">
                      {project.tasks ? `${project.tasks.filter(t => t.status === 'Completed').length}/${project.tasks.length}` : '0'}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Team Members */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Team Members
                </CardTitle>
              </CardHeader>
              <CardContent>
                {project.team_members && project.team_members.length > 0 ? (
                  <div className="space-y-3">
                    {project.team_members.map((member: any) => (
                      <div key={member.id} className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-600">
                            {member.name?.charAt(0) || member.email?.charAt(0)}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm">{member.name}</div>
                          <div className="text-xs text-gray-500">{member.role}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Users className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No team members assigned</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
        </Tabs>

        {/* Edit Task Dialog */}
        <EditTaskDialog
          task={editingTask}
          projectId={id!}
          isOpen={!!editingTask}
          onClose={() => setEditingTask(null)}
        />
      </main>
      <DockNav />
    </div>
  );
};

export default ProjectDetails;