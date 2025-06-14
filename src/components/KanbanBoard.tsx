
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

const updateLeadStatus = async ({ leadId, status }: { leadId: string; status: LeadStatus }) => {
  const { error } = await supabase.from('leads').update({ status }).eq('id', leadId);
  if (error) throw new Error(error.message);
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

export const KanbanBoard = () => {
  const queryClient = useQueryClient();
  const [data, setData] = useState<KanbanData>(initialData);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  const { data: leadsData, isLoading } = useQuery({
    queryKey: ['leads'],
    queryFn: fetchLeads,
  });

  const updateLeadMutation = useMutation({
    mutationFn: updateLeadStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
  });

  useEffect(() => {
    if (leadsData) {
      const leads = leadsData.reduce((acc, lead) => {
        acc[lead.id] = lead;
        return acc;
      }, {} as { [key: string]: Lead });

      const columns: { [key: string]: Column } = JSON.parse(JSON.stringify(initialData.columns));
      Object.values(columns).forEach(c => (c.leadIds = []));
      
      leadsData.forEach(lead => {
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
  }, [leadsData]);

  useEffect(() => {
    const channel = supabase.channel('realtime-leads')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ['leads'] });
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

    // Update backend
    updateLeadMutation.mutate({ leadId: draggableId, status: newStatus });
  };
  
  if (isLoading) {
    return (
      <div className="flex gap-4 overflow-x-auto p-4 h-full">
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
        <div className="flex gap-4 overflow-x-auto p-4 h-full">
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
