
import { useState, useEffect } from 'react';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { KanbanColumn } from './KanbanColumn';
import { KanbanData, Lead, LeadStatus, Column } from '@/types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { LeadDetailsModal } from './LeadDetailsModal';

const fetchLeads = async (): Promise<Lead[]> => {
  const { data, error } = await supabase.from('leads').select('*').order('created_at', { ascending: true });
  if (error) throw new Error(error.message);
  return data as Lead[];
};

const fetchLeadsWithStatusHistory = async (): Promise<any[]> => {
  const { data, error } = await supabase
    .from('leads')
    .select(`
      *,
      lead_status_history(changed_at, new_status, old_status)
    `)
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
    'Converted': { id: 'Converted', title: 'Converted', leadIds: [] },
    'Dropped': { id: 'Dropped', title: 'Dropped', leadIds: [] },
  },
  columnOrder: ['New', 'Contacted', 'Qualified', 'Proposal Sent', 'Converted', 'Dropped'],
};

interface KanbanBoardProps {
  searchTerm?: string;
  dateFilter?: Date;
  startDateFilter?: Date;
  endDateFilter?: Date;
}

export const KanbanBoard = ({ searchTerm = '', dateFilter, startDateFilter, endDateFilter }: KanbanBoardProps) => {
  const queryClient = useQueryClient();
  const [data, setData] = useState<KanbanData>(initialData);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  const { data: leadsData, isLoading } = useQuery({
    queryKey: ['leads-with-history'],
    queryFn: fetchLeadsWithStatusHistory,
  });

  const updateLeadMutation = useMutation({
    mutationFn: updateLeadStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['leads-with-history'] });
      queryClient.invalidateQueries({ queryKey: ['lead-status-history'] });
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

    // Update backend with timestamp tracking
    updateLeadMutation.mutate({ leadId: draggableId, status: newStatus });
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
        <div className="flex gap-4 overflow-x-auto min-h-[600px]">
          {data.columnOrder.map(columnId => {
            const column = data.columns[columnId];
            if (!column) return null;
            const leads = column.leadIds.map(leadId => data.leads[leadId]).filter(Boolean);
            return <KanbanColumn key={column.id} columnId={column.id} title={column.title} leads={leads} onCardClick={setSelectedLead} />;
          })}
        </div>
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
