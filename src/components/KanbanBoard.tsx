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

const initialData: KanbanData = {
  leads: {},
  columns: {
    'New': { id: 'New', title: 'New', leadIds: [] },
    'Contacted': { id: 'Contacted', title: 'Contacted', leadIds: [] },
    'Qualified': { id: 'Qualified', title: 'Qualified', leadIds: [] },
    'Proposal Sent': { id: 'Proposal Sent', title: 'Proposal Sent', leadIds: [] },
    'Approvals': { id: 'Approvals', title: 'Approvals', leadIds: [] },
    'Converted': { id: 'Converted', title: 'Converted', leadIds: [] },
    'Dropped': { id: 'Dropped', title: 'Dropped', leadIds: [] },
  },
  columnOrder: ['New', 'Contacted', 'Qualified', 'Proposal Sent', 'Approvals', 'Converted', 'Dropped'],
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
  const [data, setData] = useState<KanbanData>(initialData);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  const { data: leadsData, isLoading } = useQuery({
    queryKey: ['leads-with-history', workspaceId],
    queryFn: () => fetchLeadsWithStatusHistory(workspaceId),
    enabled: !!workspaceId,
  });

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

  useEffect(() => {
    if (leadsData) {
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

      const columns: { [key: string]: Column } = JSON.parse(JSON.stringify(initialData.columns));
      Object.values(columns).forEach(c => (c.leadIds = []));
      
      filteredLeadsData.forEach(leadData => {
        const lead = leadData as Lead;
        if (columns[lead.status]) {
          columns[lead.status].leadIds.push(lead.id);
        }
      });

      setData({
        leads,
        columns,
        columnOrder: initialData.columnOrder,
      });
    }
  }, [leadsData, searchTerm, dateFilter, startDateFilter, endDateFilter]);

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
        {initialData.columnOrder.map(columnId => (
          <div key={columnId} className="flex flex-col w-80 bg-secondary rounded-lg p-2 flex-shrink-0">
            <Skeleton className="h-8 w-3/4 mb-4" />
            <Skeleton className="h-24 w-full mb-4" />
            <Skeleton className="h-24 w-full mb-4" />
          </div>
        ))}
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
