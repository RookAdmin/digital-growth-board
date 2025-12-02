import { Lead } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Draggable } from '@hello-pangea/dnd';
import { Mail, Phone, Briefcase, Trash2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from "sonner";
import { useState, useEffect } from 'react';
import { useWorkspaceId } from '@/hooks/useWorkspaceId';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface KanbanCardProps {
  lead: Lead;
  index: number;
  onCardClick: (lead: Lead) => void;
}

const statusColors: { [key in Lead['status']]: string } = {
  New: "bg-[#F1F1F1] text-[#131313] border border-[#E0E0E0]",
  Contacted: "bg-[#131313] text-[#FAF9F6] border border-[#131313]",
  Qualified: "bg-[#222222] text-[#FAF9F6] border border-[#222222]",
  "Proposal Sent": "bg-[#FAF9F6] text-[#131313] border border-[#E0E0E0]",
  Approvals: "bg-[#131313] text-[#FAF9F6] border border-[#131313]",
  Converted: "bg-[#222222] text-[#FAF9F6] border border-[#222222]",
  Dropped: "bg-[#F1F1F1] text-[#222222] border border-[#E0E0E0]",
};

export const KanbanCard = ({ lead, index, onCardClick }: KanbanCardProps) => {
  const queryClient = useQueryClient();
  const workspaceId = useWorkspaceId();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isApprovalConfirmOpen, setIsApprovalConfirmOpen] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  // Fetch user role
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        supabase
          .from('team_members')
          .select('role')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .single()
          .then(({ data }) => {
            setUserRole(data?.role || null);
          });
      }
    });
  }, []);

  const requestApprovalMutation = useMutation({
    mutationFn: async (leadToApprove: Lead) => {
      const { error } = await supabase
        .from('leads')
        .update({ status: 'Approvals' })
        .eq('id', leadToApprove.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Lead sent for approval!");
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['leads-with-history'] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to send for approval: ${error.message}`);
    },
  });

  const convertToClientMutation = useMutation({
    mutationFn: async (leadToConvert: Lead) => {
      if (!workspaceId) throw new Error('Workspace ID is required');
      
      // 1. Check if a client with this email already exists
      const { data: existingClient, error: checkError } = await supabase
        .from('clients')
        .select('*')
        .eq('email', leadToConvert.email)
        .eq('workspace_id', workspaceId)
        .maybeSingle();

      if (checkError) throw checkError;

      if (existingClient) {
        // Client already exists. Just update the lead status.
        const { error: leadError } = await supabase
          .from('leads')
          .update({ status: 'Converted' })
          .eq('id', leadToConvert.id);

        if (leadError) throw leadError;
        
        return { ...existingClient, wasExisting: true };
      }

      // 2. If client does not exist, create a new one.
      const { data: clientData, error: clientError } = await supabase.from('clients').insert({
        name: leadToConvert.name,
        email: leadToConvert.email,
        phone: leadToConvert.phone,
        business_name: leadToConvert.business_name,
        lead_id: leadToConvert.id,
        services_interested: leadToConvert.services_interested,
        budget_range: leadToConvert.budget_range,
        workspace_id: workspaceId,
      }).select().single();

      if (clientError) throw clientError;

      // Create auth user for the client via Edge Function
      // This is critical for client portal access
      try {
        console.log("Calling create-client-auth Edge Function for client:", {
          client_id: clientData.id,
          email: clientData.email,
          phone: clientData.phone,
          name: clientData.name
        });

        const { data: authData, error: authError } = await supabase.functions.invoke('create-client-auth', {
          body: {
            client_id: clientData.id,
            email: clientData.email,
            phone: clientData.phone || '',
            name: clientData.name || clientData.email
          }
        });

        if (authError) {
          console.error("Failed to create auth user:", authError);
          console.error("Auth error details:", {
            message: authError.message,
            context: authError.context,
            name: authError.name
          });
          toast.error(`Client created but failed to create login credentials. Error: ${authError.message}`);
          // Don't fail the conversion, but log the error
        } else if (authData?.success) {
          console.log("Auth user created successfully for client:", clientData.email, authData);
          toast.success("Client created with login credentials! Default password: Welcome@Rook");
        } else {
          console.warn("Edge Function returned unexpected response:", authData);
          toast.warning("Client created but auth user creation status unclear. Please verify login.");
        }
      } catch (authErr: any) {
        console.error("Exception calling create-client-auth function:", authErr);
        console.error("Exception details:", {
          message: authErr?.message,
          stack: authErr?.stack,
          name: authErr?.name
        });
        toast.error(`Client created but Edge Function call failed: ${authErr?.message || 'Unknown error'}`);
        // Continue even if auth user creation fails - it can be fixed manually
      }

      // 3. Create a project for the new client
      const { error: projectError } = await supabase.from('projects').insert({
        client_id: clientData.id,
        name: `${clientData.business_name || clientData.name}'s Initial Project`,
        description: `Project created from lead conversion. Services of interest: ${leadToConvert.services_interested?.join(', ') || 'Not specified'}.`,
        status: 'Not Started',
        workspace_id: workspaceId,
      });

      if (projectError) {
        console.error('Failed to create project for new client:', projectError);
        toast.error(`Client created, but failed to create project: ${projectError.message}`);
        // We still proceed even if project creation fails.
      }

      // 4. Update lead status
      const { error: leadError } = await supabase
        .from('leads')
        .update({ status: 'Converted' })
        .eq('id', leadToConvert.id);

      if (leadError) {
        console.error('Failed to update lead status, but client and project were created:', clientData);
        throw leadError;
      }
      return { ...clientData, wasExisting: false };
    },
    onSuccess: (data) => {
      const { wasExisting, ...client } = data;

      if (wasExisting) {
        toast.info(`Client with email ${client.email} already exists. Lead status updated.`);
      } else {
        toast.success("Lead converted to client and initial project created!");
      }

      // Refetch queries immediately to update the UI
      queryClient.refetchQueries({ queryKey: ['leads', workspaceId] });
      queryClient.refetchQueries({ queryKey: ['leads-with-history'] });
      queryClient.refetchQueries({ queryKey: ['clients', workspaceId] }); // Force refetch to show new client immediately
      queryClient.invalidateQueries({ queryKey: ['projects', workspaceId] });
    },
    onError: (error: Error) => {
      toast.error(`Conversion failed: ${error.message}`);
    },
  });

  const deleteLeadMutation = useMutation({
    mutationFn: async (leadId: string) => {
      const { error } = await supabase.from('leads').delete().eq('id', leadId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Lead deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete lead: ${error.message}`);
    },
  });

  const handleRequestApproval = (e: React.MouseEvent) => {
    e.stopPropagation();
    requestApprovalMutation.mutate(lead);
  };

  const handleConfirmConversion = (e: React.MouseEvent) => {
    e.stopPropagation();
    convertToClientMutation.mutate(lead);
    setIsApprovalConfirmOpen(false);
  };
  
  const handleOpenDialog = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsConfirmOpen(true);
  }

  const handleOpenApprovalDialog = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsApprovalConfirmOpen(true);
  };

  const handleOpenDeleteDialog = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDeleteConfirmOpen(true);
  };

  const handleConfirmDeletion = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteLeadMutation.mutate(lead.id);
    setIsDeleteConfirmOpen(false);
  };

  return (
    <Draggable draggableId={lead.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`transition-all duration-200 ${snapshot.isDragging ? 'rotate-2 scale-105 shadow-lg' : ''}`}
          onClick={() => onCardClick(lead)}
        >
          <Card className="bg-white hover:bg-gray-50 transition-colors cursor-pointer shadow-sm hover:shadow-md border border-gray-200 rounded-xl">
            <CardHeader className="p-3 pb-2">
              <div className="flex justify-between items-start">
                <div className="flex-1 mr-2 min-w-0">
                  <CardTitle className="text-sm font-semibold leading-tight break-words text-gray-900">{lead.name}</CardTitle>
                  {lead.business_name && (
                    <div className="flex items-center gap-1 text-xs text-gray-600 mt-1">
                      <Briefcase size={12} className="shrink-0" /> 
                      <span className="break-words">{lead.business_name}</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Badge className={`${statusColors[lead.status]} text-xs px-2 py-0.5 rounded-lg`}>
                    {lead.status}
                  </Badge>
                  <AlertDialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleOpenDeleteDialog}
                      className="h-5 w-5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                      disabled={deleteLeadMutation.isPending}
                    >
                      <Trash2 size={12} />
                    </Button>
                    <AlertDialogContent className="bg-white border border-gray-200 rounded-xl shadow-lg" onClick={(e) => e.stopPropagation()}>
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-gray-900">Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-600">
                          This will permanently delete the lead "{lead.name}". This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel 
                          onClick={(e) => e.stopPropagation()}
                          className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-xl"
                        >
                          Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleConfirmDeletion}
                          className="bg-red-600 text-white hover:bg-red-700 hover:text-white rounded-xl"
                          disabled={deleteLeadMutation.isPending}
                        >
                          {deleteLeadMutation.isPending ? 'Deleting...' : 'Delete'}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-3 pt-0 text-xs text-gray-600 space-y-1">
              <div className="flex items-center gap-1 min-w-0">
                <Mail size={12} className="shrink-0 text-gray-500" /> 
                <span className="break-all">{lead.email}</span>
              </div>
              {lead.phone && (
                <div className="flex items-center gap-1 min-w-0">
                  <Phone size={12} className="shrink-0 text-gray-500" /> 
                  <span className="break-words">{lead.phone}</span>
                </div>
              )}
              {lead.lead_source && (
                <p className="text-xs break-words text-gray-600"><strong>Source:</strong> {lead.lead_source}</p>
              )}
              {lead.budget_range && (
                <p className="text-xs break-words text-gray-600"><strong>Budget:</strong> {lead.budget_range}</p>
              )}
              {/* Request Approval Button - for non-converted/dropped/approval leads */}
              {lead.status !== 'Converted' && lead.status !== 'Dropped' && lead.status !== 'Approvals' && (
                <Button
                  className="w-full mt-2 bg-orange-600 text-white hover:bg-orange-700 hover:text-white rounded-xl"
                  size="sm"
                  onClick={handleRequestApproval}
                  disabled={requestApprovalMutation.isPending}
                >
                  {requestApprovalMutation.isPending ? 'Requesting...' : 'Request Approval'}
                </Button>
              )}
              
              {/* Convert to Client Button - only for leads in Approvals status and only for Admins */}
              {lead.status === 'Approvals' && userRole === 'Admin' && (
                <AlertDialog open={isApprovalConfirmOpen} onOpenChange={setIsApprovalConfirmOpen}>
                  <Button
                    className="w-full mt-2 bg-[#131313] text-white hover:bg-[#222222] hover:text-white rounded-xl"
                    size="sm"
                    onClick={handleOpenApprovalDialog}
                    disabled={convertToClientMutation.isPending}
                  >
                    {convertToClientMutation.isPending ? 'Converting...' : 'Approve & Convert'}
                  </Button>
                  <AlertDialogContent className="bg-white border border-gray-200 rounded-xl shadow-lg" onClick={(e) => e.stopPropagation()}>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-gray-900">Approve and Convert Lead?</AlertDialogTitle>
                      <AlertDialogDescription className="text-gray-600">
                        This will approve and convert "{lead.name}" into a client. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-xl">
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={handleConfirmConversion}
                        className="bg-[#131313] text-white hover:bg-[#222222] hover:text-white rounded-xl"
                      >
                        Approve & Convert
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </Draggable>
  );
};
