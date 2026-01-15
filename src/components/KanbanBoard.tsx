import { useState, useEffect } from 'react';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { KanbanColumn } from './KanbanColumn';
import { KanbanData, Lead, LeadStatus, Column } from '@/types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { LeadDetailsModal } from './LeadDetailsModal';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { useWorkspaceId } from '@/hooks/useWorkspaceId';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const fetchLeads = async (workspaceId: string | null): Promise<Lead[]> => {
  if (!workspaceId) return [];
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: true });
  if (error) throw new Error(error.message);
  return data as Lead[];
};

const fetchLeadsWithStatusHistory = async (workspaceId: string | null): Promise<any[]> => {
  if (!workspaceId) return [];
  const { data, error } = await supabase
    .from('leads')
    .select(`
      *,
      lead_status_history(changed_at, new_status, old_status)
    `)
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: true });
  
  if (error) throw new Error(error.message);
  return data;
};

const updateLeadStatus = async ({ leadId, status }: { leadId: string; status: LeadStatus }) => {
  // First get the current lead to track old status
  const { data: currentLead } = await supabase
    .from('leads')
    .select('status')
    .eq('id', leadId)
    .single();

  // Update the lead status
  const { error } = await supabase.from('leads').update({ status }).eq('id', leadId);
  if (error) throw new Error(error.message);

  // Record the status change in history with current timestamp
  if (currentLead && currentLead.status !== status) {
    const { data: { user } } = await supabase.auth.getUser();
    const { error: historyError } = await supabase.from('lead_status_history').insert({
      lead_id: leadId,
      old_status: currentLead.status,
      new_status: status,
      changed_by: user?.id,
      changed_at: new Date().toISOString()
    });
    
    if (historyError) {
      console.error('Failed to record status change:', historyError);
    }
  }
};

// Helper function to build initial data from lead statuses
const buildInitialData = (leadStatuses: Array<{ name: string }>): KanbanData => {
  const columns: { [key: string]: Column } = {};
  const columnOrder: string[] = [];

  leadStatuses.forEach(status => {
    columns[status.name] = { id: status.name as LeadStatus, title: status.name as LeadStatus, leadIds: [] };
    columnOrder.push(status.name);
  });

  return {
    leads: {},
    columns,
    columnOrder,
  };
};

interface KanbanBoardProps {
  searchTerm?: string;
  dateFilter?: Date;
  startDateFilter?: Date;
  endDateFilter?: Date;
}

export const KanbanBoard = ({ searchTerm = '', dateFilter, startDateFilter, endDateFilter }: KanbanBoardProps) => {
  const queryClient = useQueryClient();
  const workspaceId = useWorkspaceId();
  const navigate = useNavigate();
  const [data, setData] = useState<KanbanData>({ leads: {}, columns: {}, columnOrder: [] });
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  // Fetch lead statuses for this workspace
  const { data: leadStatuses = [], isLoading: statusesLoading } = useQuery({
    queryKey: ['lead-statuses', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];
      // Use type assertion since lead_statuses table types haven't been generated yet
      const { data, error } = await (supabase as any)
        .from('lead_statuses')
        .select('name, display_order')
        .eq('workspace_id', workspaceId)
        .eq('is_active', true)
        .order('display_order', { ascending: true });
      
      if (error) throw error;
      return (data || []) as Array<{ name: string; display_order: number }>;
    },
    enabled: !!workspaceId,
  });

  const { data: leadsData, isLoading: leadsLoading } = useQuery({
    queryKey: ['leads-with-history', workspaceId],
    queryFn: () => fetchLeadsWithStatusHistory(workspaceId),
    enabled: !!workspaceId,
  });

  const isLoading = statusesLoading || leadsLoading;

  const updateLeadMutation = useMutation({
    mutationFn: updateLeadStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['leads-with-history', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['lead-status-history'] });
    },
  });

  // Conversion mutation for when lead is moved to "Converted"
  const convertLeadMutation = useMutation({
    mutationFn: async (leadId: string) => {
      if (!workspaceId) throw new Error('Workspace ID is required');
      
      const { data: lead, error: leadError } = await supabase
        .from("leads")
        .select("*")
        .eq("id", leadId)
        .maybeSingle();

      if (leadError || !lead) {
        throw new Error(leadError?.message || "Lead not found");
      }

      const { data: existingClient, error: existingClientError } = await supabase
        .from("clients")
        .select("id")
        .eq("email", lead.email)
        .eq("workspace_id", workspaceId)
        .maybeSingle();
      if (existingClientError) {
        throw new Error(existingClientError.message);
      }

      if (existingClient) {
        const { error: leadUpdateError } = await supabase
          .from("leads")
          .update({ status: "Converted", client_id: existingClient.id })
          .eq("id", leadId);
        if (leadUpdateError) {
          throw new Error(leadUpdateError.message);
        }

        const { data: { user } } = await supabase.auth.getUser();
        await supabase.from("lead_status_history").insert({
          lead_id: leadId,
          old_status: lead.status,
          new_status: "Converted",
          changed_by: user?.id,
          changed_at: new Date().toISOString(),
        });

        return { wasExisting: true };
      }

      const { data: newClient, error: clientError } = await supabase
        .from("clients")
        .insert({
          name: lead.name,
          email: lead.email,
          phone: lead.phone,
          business_name: lead.business_name,
          lead_id: lead.id,
          services_interested: lead.services_interested,
          budget_range: lead.budget_range,
          workspace_id: workspaceId,
        })
        .select()
        .single();

      if (clientError) {
        console.error("Client creation error:", clientError);
        console.error("Error details:", {
          code: clientError.code,
          message: clientError.message,
          details: clientError.details,
          hint: clientError.hint,
        });
        throw new Error(`Failed to create client: ${clientError.message}`);
      }

      if (!newClient) {
        console.error("Client insert returned no data");
        throw new Error("Client was not created successfully - no data returned");
      }

      console.log("Client created successfully:", newClient.id);

      const { error: projectError } = await supabase
        .from("projects")
        .insert({
          client_id: newClient.id,
          name: `${newClient.business_name || newClient.name}'s Initial Project`,
          description: `Project created from lead conversion. Services of interest: ${lead.services_interested?.join(", ") || "Not specified"}.`,
          status: "Not Started",
          workspace_id: workspaceId,
        });

      if (projectError) {
        console.error("Failed to create project for new client:", projectError);
      }

      const { error: leadUpdateError } = await supabase
        .from("leads")
        .update({ status: "Converted", client_id: newClient.id })
        .eq("id", leadId);

      if (leadUpdateError) {
        throw new Error(leadUpdateError.message);
      }

      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from("lead_status_history").insert({
        lead_id: leadId,
        old_status: lead.status,
        new_status: "Converted",
        changed_by: user?.id,
        changed_at: new Date().toISOString(),
      });

      return { wasExisting: false };
    },
    onSuccess: async ({ wasExisting }) => {
      toast.success(
        wasExisting
          ? "Lead linked to existing client."
          : "Lead converted to client and project created."
      );
      
      // Small delay to ensure database transaction is complete
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Invalidate and refetch queries to ensure UI updates
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["leads", workspaceId] }),
        queryClient.invalidateQueries({ queryKey: ["leads-with-history", workspaceId] }),
        queryClient.invalidateQueries({ queryKey: ["clients", workspaceId] }),
        queryClient.invalidateQueries({ queryKey: ["projects", workspaceId] }),
      ]);
      
      // Force refetch clients to ensure new client appears immediately
      await queryClient.refetchQueries({ queryKey: ["clients"] });
      await queryClient.refetchQueries({ queryKey: ["leads"] });
    },
    onError: (error: Error) => {
      toast.error(`Conversion failed: ${error.message}`);
      // Revert optimistic update on error by refetching leads
      queryClient.invalidateQueries({ queryKey: ['leads-with-history'] });
      queryClient.refetchQueries({ queryKey: ['leads-with-history'] });
    },
  });

  // Initialize data structure when statuses are loaded
  // Only use statuses from database - no fallback defaults
  useEffect(() => {
    if (leadStatuses.length > 0) {
      const initialData = buildInitialData(leadStatuses);
      setData(initialData);
    } else if (workspaceId && !statusesLoading) {
      // No statuses found - show empty state (statuses should be created via Settings)
      setData({ leads: {}, columns: {}, columnOrder: [] });
    }
  }, [leadStatuses, workspaceId, statusesLoading]);

  useEffect(() => {
    if (leadsData && leadStatuses.length > 0) {
      // Only use statuses from database - each workspace has its own statuses
      const statusesToUse = leadStatuses;
      let filteredLeadsData = leadsData.filter(leadData => {
        const lead = leadData as Lead & { lead_status_history: any[] };
        const term = searchTerm.toLowerCase();
        const matchesSearch = !term || (
          lead.name.toLowerCase().includes(term) ||
          lead.email.toLowerCase().includes(term) ||
          (lead.phone && lead.phone.toLowerCase().includes(term))
        );

        // Single date filter (creation date)
        const matchesDate = !dateFilter || 
          new Date(lead.created_at).toDateString() === dateFilter.toDateString();

        // Date range filter (status change timestamps)
        let matchesDateRange = true;
        if (startDateFilter || endDateFilter) {
          matchesDateRange = false;
          
          // Check lead creation date
          const createdDate = new Date(lead.created_at);
          let createdMatches = true;
          if (startDateFilter) {
            createdMatches = createdMatches && createdDate >= startDateFilter;
          }
          if (endDateFilter) {
            const endOfDay = new Date(endDateFilter);
            endOfDay.setHours(23, 59, 59, 999);
            createdMatches = createdMatches && createdDate <= endOfDay;
          }
          
          if (createdMatches) {
            matchesDateRange = true;
          }

          // Check status change dates
          if (!matchesDateRange && lead.lead_status_history) {
            for (const history of lead.lead_status_history) {
              const statusChangeDate = new Date(history.changed_at);
              let statusMatches = true;
              
              if (startDateFilter) {
                statusMatches = statusMatches && statusChangeDate >= startDateFilter;
              }
              if (endDateFilter) {
                const endOfDay = new Date(endDateFilter);
                endOfDay.setHours(23, 59, 59, 999);
                statusMatches = statusMatches && statusChangeDate <= endOfDay;
              }
              
              if (statusMatches) {
                matchesDateRange = true;
                break;
              }
            }
          }
        }

        return matchesSearch && matchesDate && matchesDateRange;
      });

      const leads = filteredLeadsData.reduce((acc, leadData) => {
        const lead = leadData as Lead;
        acc[lead.id] = lead;
        return acc;
      }, {} as { [key: string]: Lead });

      // Build columns from statuses to use
      const columns: { [key: string]: Column } = {};
      const columnOrder: string[] = [];
      
      statusesToUse.forEach(status => {
        columns[status.name] = { id: status.name as LeadStatus, title: status.name as LeadStatus, leadIds: [] };
        columnOrder.push(status.name);
      });
      
      // Assign leads to columns
      filteredLeadsData.forEach(leadData => {
        const lead = leadData as Lead;
        if (columns[lead.status]) {
          columns[lead.status].leadIds.push(lead.id);
        }
      });

      setData({
        leads,
        columns,
        columnOrder,
      });
    }
  }, [leadsData, leadStatuses, searchTerm, dateFilter, startDateFilter, endDateFilter, workspaceId]);

  useEffect(() => {
    const channel = supabase.channel('realtime-leads')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ['leads'] });
          queryClient.invalidateQueries({ queryKey: ['leads-with-history'] });
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const handleUpdateLeadStatus = (leadId: string, status: LeadStatus) => {
    updateLeadMutation.mutate({ leadId, status });
  };

  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const startColumn = data.columns[source.droppableId];
    const finishColumn = data.columns[destination.droppableId];

    // Optimistic UI update
    const startLeadIds = Array.from(startColumn.leadIds);
    startLeadIds.splice(source.index, 1);
    const newStart = { ...startColumn, leadIds: startLeadIds };

    const finishLeadIds = Array.from(finishColumn.leadIds);
    finishLeadIds.splice(destination.index, 0, draggableId);
    const newFinish = { ...finishColumn, leadIds: finishLeadIds };

    const movedLead = data.leads[draggableId];
    const newStatus = destination.droppableId as LeadStatus;
    movedLead.status = newStatus;
    
    const newData: KanbanData = {
      ...data,
      leads: { ...data.leads, [draggableId]: movedLead },
      columns: { ...data.columns, [newStart.id]: newStart, [newFinish.id]: newFinish },
    };
    if (startColumn !== finishColumn) {
      newData.columns[newStart.id] = newStart;
    }

    setData(newData);

    // If moving to "Converted", trigger full conversion process
    // Otherwise, just update the status
    if (newStatus === 'Converted') {
      convertLeadMutation.mutate(draggableId, {
        onError: () => {
          // Revert the optimistic update on error
          queryClient.refetchQueries({ queryKey: ['leads-with-history'] });
        }
      });
    } else {
      // Update backend with timestamp tracking
      updateLeadMutation.mutate({ leadId: draggableId, status: newStatus });
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex gap-4 overflow-x-auto min-h-[600px]">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex flex-col w-80 bg-secondary rounded-lg p-2 flex-shrink-0">
            <Skeleton className="h-8 w-3/4 mb-4" />
            <Skeleton className="h-24 w-full mb-4" />
            <Skeleton className="h-24 w-full mb-4" />
          </div>
        ))}
      </div>
    );
  }

  // Show message if no statuses are configured
  if (!isLoading && data.columnOrder.length === 0 && leadStatuses.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[600px] bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <div className="text-center p-8">
          <p className="text-lg font-medium text-gray-900 mb-2">No Lead Statuses Configured</p>
          <p className="text-sm text-gray-600 mb-4">
            Please configure your lead status columns in Settings to get started.
          </p>
          {workspaceId && (
            <Button
              onClick={() => navigate(`/settings/${workspaceId}`)}
              className="mt-4"
            >
              Go to Settings
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <DragDropContext onDragEnd={onDragEnd}>
        <ScrollArea className="w-full">
          <div className="flex gap-4 min-h-[600px] pb-4">
            {data.columnOrder.map(columnId => {
              const column = data.columns[columnId];
              if (!column) return null;
              const leads = column.leadIds.map(leadId => data.leads[leadId]).filter(Boolean);
              return <KanbanColumn key={column.id} columnId={column.id} title={column.title} leads={leads} onCardClick={setSelectedLead} />;
            })}
          </div>
          <ScrollBar orientation="horizontal" className="mt-2" />
        </ScrollArea>
      </DragDropContext>
      <LeadDetailsModal
        lead={selectedLead}
        isOpen={!!selectedLead}
        onClose={() => setSelectedLead(null)}
        onUpdateLeadStatus={handleUpdateLeadStatus}
      />
    </>
  );
};
