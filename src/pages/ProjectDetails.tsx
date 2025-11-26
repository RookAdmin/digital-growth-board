import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Calendar, DollarSign, Users, FolderOpen, Plus, Edit, Flag, ReceiptText, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { Project, Task, Invoice } from '@/types';
import { AddTaskForm } from '@/components/AddTaskForm';
import { ProjectFileManager } from '@/components/ProjectFileManager';
import { ProjectAgreements } from '@/components/ProjectAgreements';
import { ProjectActivityLog } from '@/components/ProjectActivityLog';
import { ProjectTeamManager } from '@/components/ProjectTeamManager';
import { EditTaskDialog } from '@/components/EditTaskDialog';
import { pillClasses } from '@/constants/palette';
import { DockNav } from '@/components/DockNav';
import { LoadingState } from '@/components/LoadingState';
import { AddInvoiceForm } from '@/components/AddInvoiceForm';

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

interface ProjectTeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
}

type ProjectDetailsProject = Project & {
  tasks: Task[];
  team_members: ProjectTeamMember[];
  invoices: Invoice[];
};

const getInvoiceStatusColor = (status: string) => {
  switch (status) {
    case 'Paid':
      return pillClasses.soft;
    case 'Sent':
      return pillClasses.dark;
    case 'Overdue':
      return pillClasses.charcoal;
    case 'Draft':
    default:
      return pillClasses.light;
  }
};

const formatCurrency = (value: number, currency: string) => {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value || 0);
  } catch {
    return `$${(value || 0).toFixed(2)}`;
  }
};

const ProjectDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showAddMilestone, setShowAddMilestone] = useState(false);
  const [showAddInvoice, setShowAddInvoice] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);

  useEffect(() => {
    document.title = "Project Details - Rook";
  }, []);

  const { data: projectData, isLoading } = useQuery<any>({
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

      const { data: invoices } = await supabase
        .from('invoices')
        .select('*')
        .eq('project_id', id)
        .order('created_at', { ascending: false });
      
      return data ? ({ ...data, tasks: tasks || [], team_members: teamMembers || [], invoices: invoices || [] } as ProjectDetailsProject) : null;
    },
    enabled: !!id,
  });

  const project = projectData as ProjectDetailsProject | null;

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

  const milestoneTasks = project.tasks?.filter((task) => task.type === 'milestone') || [];
  const completedMilestones = milestoneTasks.filter((milestone) => milestone.status === 'Completed').length;
  const linkedMilestones = milestoneTasks.filter((milestone) => milestone.invoice_id).length;
  const projectInvoices = project.invoices || [];

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
            <TabsTrigger value="milestones">Milestones & Finance</TabsTrigger>
            <TabsTrigger value="files">Files</TabsTrigger>
            <TabsTrigger value="agreements">Agreements/Documents</TabsTrigger>
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

              <TabsContent value="milestones" className="space-y-6">
                {/* Milestone & Finance Section */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Flag className="w-5 h-5" />
                        Milestones & Finance
                      </CardTitle>
                      <div className="flex flex-wrap gap-2">
                        <Button variant="outline" size="sm" onClick={() => {
                          setShowAddMilestone((prev) => !prev);
                          if (showAddInvoice) setShowAddInvoice(false);
                        }}>
                          <Plus className="w-4 h-4 mr-2" />
                          {showAddMilestone ? 'Close Milestone Form' : 'Add Milestone'}
                        </Button>
                        <Button size="sm" onClick={() => {
                          setShowAddInvoice((prev) => !prev);
                          if (showAddMilestone) setShowAddMilestone(false);
                        }}>
                          <ReceiptText className="w-4 h-4 mr-2" />
                          {showAddInvoice ? 'Close Invoice Form' : 'Create Invoice'}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {showAddMilestone && (
                      <AddTaskForm
                        projectId={id!}
                        onCancel={() => setShowAddMilestone(false)}
                        defaultType="milestone"
                        hideTypeField
                        typeLabel="Milestone Type"
                        submitLabel="Add Milestone"
                      />
                    )}

                    {showAddInvoice && (
                      <AddInvoiceForm
                        projectId={id!}
                        clientId={project.client_id}
                        milestones={milestoneTasks}
                        onCancel={() => setShowAddInvoice(false)}
                      />
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                            <Flag className="w-4 h-4" />
                            Project Milestones
                          </h4>
                          <Badge variant="secondary">
                            {milestoneTasks.length} total
                          </Badge>
                        </div>

                        {milestoneTasks.length > 0 ? (
                          <div className="space-y-3">
                            {milestoneTasks.map((milestone) => {
                              const linkedInvoice = projectInvoices.find((invoice) => invoice.id === milestone.invoice_id);
                              return (
                              <div key={milestone.id} className="border border-gray-200 rounded-lg p-4">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="space-y-2">
                                    <div className="flex flex-col">
                                      <span className="font-medium text-gray-900">{milestone.title}</span>
                                      <span className="text-xs text-gray-500 capitalize">{milestone.priority} priority</span>
                                    </div>
                                    {milestone.description && (
                                      <p className="text-sm text-gray-600">{milestone.description}</p>
                                    )}
                                    <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                                      <Badge variant="outline" className="text-xs">
                                        {milestone.status}
                                      </Badge>
                                      {milestone.due_date && (
                                        <span>Due {format(new Date(milestone.due_date), 'MMM dd, yyyy')}</span>
                                      )}
                                      {linkedInvoice && (
                                        <span className="text-gray-600">
                                          Linked Invoice #{linkedInvoice.invoice_number}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setEditingTask(milestone)}
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            );
                            })}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500 border border-dashed border-gray-300 rounded-lg p-6 text-center">
                            No milestones created yet. Use “Add Milestone” to define delivery checkpoints.
                          </p>
                        )}
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                            <ReceiptText className="w-4 h-4" />
                            Project Invoices
                          </h4>
                          <Badge variant="secondary">
                            {projectInvoices.length} total
                          </Badge>
                        </div>

                        {projectInvoices.length > 0 ? (
                          <div className="space-y-3">
                            {projectInvoices.map((invoice) => {
                              const linkedMilestone = milestoneTasks.find((milestone) => milestone.invoice_id === invoice.id);
                              return (
                              <div key={invoice.id} className="border border-gray-200 rounded-lg p-4 flex flex-col gap-2">
                                {linkedMilestone && (
                                  <Badge variant="secondary" className="self-start text-xs">
                                    Linked Milestone: {linkedMilestone.title}
                                  </Badge>
                                )}
                                <div className="flex items-start justify-between">
                                  <div>
                                    <p className="font-medium text-gray-900">{invoice.title}</p>
                                    <p className="text-xs text-gray-500">#{invoice.invoice_number}</p>
                                  </div>
                                  <Badge className={`${getInvoiceStatusColor(invoice.status)} text-xs`} variant="secondary">
                                    {invoice.status}
                                  </Badge>
                                </div>
                                <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                                  <span>Issued {format(new Date(invoice.issued_date), 'MMM dd, yyyy')}</span>
                                  <span>Due {format(new Date(invoice.due_date), 'MMM dd, yyyy')}</span>
                                </div>
                                <div className="text-lg font-semibold text-gray-900">
                                  {formatCurrency(invoice.total_amount || invoice.amount, invoice.currency || 'USD')}
                                </div>
                                {invoice.description && (
                                  <p className="text-sm text-gray-600">{invoice.description}</p>
                                )}
                                {invoice.pdf_url && (
                                  <Button
                                    asChild
                                    variant="outline"
                                    size="sm"
                                    className="mt-2 w-fit"
                                  >
                                    <a
                                      href={invoice.pdf_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-1"
                                    >
                                      <FileText className="h-4 w-4" />
                                      View PDF
                                    </a>
                                  </Button>
                                )}
                              </div>
                            );
                            })}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500 border border-dashed border-gray-300 rounded-lg p-6 text-center">
                            No invoices yet. Use “Create Invoice” to bill milestones or project work.
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="files" className="space-y-6">
                <ProjectFileManager projectId={id!} projectName={project.name} />
              </TabsContent>

              <TabsContent value="agreements" className="space-y-6">
                <ProjectAgreements projectId={id!} />
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
                  <Flag className="w-4 h-4 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-500">Milestones Completed</div>
                    <div className="font-medium">
                      {milestoneTasks.length > 0 ? `${completedMilestones}/${milestoneTasks.length}` : '0'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <ReceiptText className="w-4 h-4 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-500">Milestones Linked to Invoices</div>
                    <div className="font-medium">{linkedMilestones}</div>
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