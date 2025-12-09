import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CalendarIcon, UserIcon, ClockIcon, DollarSign, FileText, Flag } from 'lucide-react';
import { usePartnerAuth } from '@/hooks/usePartnerAuth';
import { format } from 'date-fns';
import { pillClasses } from '@/constants/palette';
import { PartnerHeader } from '@/components/PartnerHeader';
import { PartnerDock } from '@/components/PartnerDock';
import { LoadingState } from '@/components/LoadingState';

const PartnerProject = () => {
  const { id } = useParams<{ id: string }>();
  const { partner, loading: partnerLoading } = usePartnerAuth();

  const { data: project, isLoading, error: projectError } = useQuery({
    queryKey: ['partner-project', id, partner?.id],
    queryFn: async () => {
      if (!partner?.id || !id) {
        throw new Error('Partner ID or Project ID is missing');
      }

      // First, try to get the assignment
      const { data: assignment, error: assignmentError } = await supabase
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
            deadline,
            budget,
            created_at,
            clients:client_id (
              name,
              business_name,
              email
            )
          )
        `)
        .eq('partner_id', partner.id)
        .eq('project_id', id)
        .maybeSingle();

      if (assignmentError) {
        console.error('Error fetching partner project assignment:', assignmentError);
        // Try to fetch the project directly as fallback
        const { data: projectData, error: projectError } = await supabase
          .from('projects')
          .select(`
            id,
            name,
            description,
            status,
            deadline,
            budget,
            created_at,
            clients:client_id (
              name,
              business_name,
              email
            )
          `)
          .eq('id', id)
          .maybeSingle();

        if (projectError || !projectData) {
          throw new Error(assignmentError.message || 'Project not found');
        }

        // Return with default assignment data
        return {
          assigned_role: null,
          notes: null,
          assigned_at: null,
          projects: projectData,
        };
      }

      if (!assignment) {
        console.warn('No assignment found, checking if project exists directly...');
        // Check if project exists at all
        const { data: projectData, error: projectError } = await supabase
          .from('projects')
          .select(`
            id,
            name,
            description,
            status,
            deadline,
            budget,
            created_at,
            clients:client_id (
              name,
              business_name,
              email
            )
          `)
          .eq('id', id)
          .maybeSingle();

        if (projectError) {
          console.error('Error fetching project directly:', projectError);
          throw new Error('Project not found');
        }

        if (!projectData) {
          throw new Error('Project assignment not found. This project may not be assigned to you.');
        }

        // Project exists but no assignment - return with default values
        return {
          assigned_role: null,
          notes: null,
          assigned_at: null,
          projects: projectData,
        };
      }

      return assignment;
    },
    enabled: !!partner?.id && !!id && !partnerLoading,
    retry: false,
  });

  // Fetch milestones for this project
  const { data: milestones = [], isLoading: milestonesLoading } = useQuery({
    queryKey: ['partner-project-milestones', id],
    queryFn: async () => {
      if (!id) return [];
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('project_id', id)
        .eq('type', 'milestone')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!id,
  });

  // Fetch invoices/bills for this project
  const { data: invoices = [], isLoading: invoicesLoading } = useQuery({
    queryKey: ['partner-project-invoices', id],
    queryFn: async () => {
      if (!id) return [];
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('project_id', id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!id,
  });

  if (partnerLoading || isLoading || milestonesLoading || invoicesLoading) {
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

  if (!isLoading && (!project || projectError)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f7f4ef] via-[#f4f1ff] to-[#eef7ff] pb-32">
        <PartnerHeader />
        <div className="max-w-4xl mx-auto px-4 py-16">
          <div className="rounded-3xl border border-white/70 bg-white/90 p-10 text-center shadow-[0_25px_80px_rgba(15,23,42,0.15)]">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Project not found</h2>
            <p className="text-gray-500 mb-4">
              {projectError 
                ? `Error: ${projectError.message}` 
                : "We couldn't locate this assignment. Please head back to your dashboard."}
            </p>
            {partner?.id && id && (
              <p className="text-xs text-gray-400 mb-4">
                Partner ID: {partner.id} | Project ID: {id}
              </p>
            )}
            <Button
              className="mt-6 rounded-full bg-gray-900 text-white hover:bg-black"
              onClick={() => window.location.href = '/partner/projects'}
            >
              Back to Projects
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

        <div className="space-y-6">
          {/* Project Details */}
          <Card className="border border-white/80 bg-white/90 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Project Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{projectData.name}</h3>
                <p className="text-gray-700 leading-relaxed">
                  {projectData.description || 'No description available for this project.'}
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <div className="mt-1">
                    <Badge className={getStatusColor(projectData.status)}>
                      {projectData.status}
                    </Badge>
                  </div>
                </div>
                {projectData.budget && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Budget</label>
                    <p className="text-gray-900 font-semibold mt-1">
                      ${projectData.budget?.toLocaleString()}
                    </p>
                  </div>
                )}
                {projectData.deadline && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Deadline</label>
                    <p className="text-gray-900 mt-1">
                      {format(new Date(projectData.deadline), 'MMM dd, yyyy')}
                    </p>
                  </div>
                )}
                {project.assigned_role && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Your Role</label>
                    <p className="text-gray-900 mt-1">{project.assigned_role}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-gray-500">Assigned Date</label>
                  <p className="text-gray-900 mt-1">
                    {format(new Date(project.assigned_at), 'MMM dd, yyyy')}
                  </p>
                </div>
              </div>

              {project.notes && (
                <div className="mt-4 p-4 bg-[#F1F1F1] rounded-lg">
                  <h4 className="font-medium text-[#131313] mb-2">Admin Notes</h4>
                  <p className="text-[#222222]">{project.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Milestones */}
          <Card className="border border-white/80 bg-white/90 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Flag className="h-5 w-5" />
                Milestones
                {milestones && milestones.length > 0 && (
                  <Badge variant="secondary">{milestones.length}</Badge>
                )}
              </CardTitle>
              <CardDescription>
                Project milestones and their progress
              </CardDescription>
            </CardHeader>
            <CardContent>
              {milestones && milestones.length > 0 ? (
                <div className="space-y-4">
                  {milestones.map((milestone: any) => (
                    <div key={milestone.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-gray-900">{milestone.title}</h4>
                        <Badge className={getStatusColor(milestone.status)}>
                          {milestone.status}
                        </Badge>
                      </div>
                      {milestone.description && (
                        <p className="text-gray-600 text-sm mb-2">{milestone.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        {milestone.due_date && (
                          <div className="flex items-center gap-1">
                            <ClockIcon className="h-4 w-4" />
                            Due: {format(new Date(milestone.due_date), 'MMM dd, yyyy')}
                          </div>
                        )}
                        {milestone.created_at && (
                          <div className="flex items-center gap-1">
                            <CalendarIcon className="h-4 w-4" />
                            Created: {format(new Date(milestone.created_at), 'MMM dd, yyyy')}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">
                  No milestones have been set for this project yet.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Bills/Invoices */}
          <Card className="border border-white/80 bg-white/90 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Bills & Invoices
                {invoices && invoices.length > 0 && (
                  <Badge variant="secondary">{invoices.length}</Badge>
                )}
              </CardTitle>
              <CardDescription>
                All invoices and bills related to this project
              </CardDescription>
            </CardHeader>
            <CardContent>
              {invoices && invoices.length > 0 ? (
                <div className="space-y-4">
                  {invoices.map((invoice: any) => (
                    <div key={invoice.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{invoice.title || 'Invoice'}</h4>
                          {invoice.invoice_number && (
                            <p className="text-sm text-gray-600">#{invoice.invoice_number}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">
                            ${(invoice.total_amount || invoice.amount || 0).toLocaleString()}
                          </p>
                          <Badge className={getStatusColor(invoice.status)}>
                            {invoice.status}
                          </Badge>
                        </div>
                      </div>
                      {invoice.description && (
                        <p className="text-gray-600 text-sm mb-2">{invoice.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        {invoice.issued_date && (
                          <div className="flex items-center gap-1">
                            <CalendarIcon className="h-4 w-4" />
                            Issued: {format(new Date(invoice.issued_date), 'MMM dd, yyyy')}
                          </div>
                        )}
                        {invoice.due_date && (
                          <div className="flex items-center gap-1">
                            <ClockIcon className="h-4 w-4" />
                            Due: {format(new Date(invoice.due_date), 'MMM dd, yyyy')}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">
                  No invoices or bills have been created for this project yet.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

      </div>
      <PartnerDock />
    </div>
  );
};

export default PartnerProject;
