
import { useState } from 'react';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { KanbanColumn } from './KanbanColumn';
import { mockData } from '@/data/mock-leads';
import { KanbanData, LeadStatus } from '@/types';

export const KanbanBoard = () => {
  const [data, setData] = useState<KanbanData>(mockData);

  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) {
      return;
    }

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const startColumn = data.columns[source.droppableId];
    const finishColumn = data.columns[destination.droppableId];

    if (startColumn === finishColumn) {
      const newLeadIds = Array.from(startColumn.leadIds);
      newLeadIds.splice(source.index, 1);
      newLeadIds.splice(destination.index, 0, draggableId);

      const newColumn = {
        ...startColumn,
        leadIds: newLeadIds,
      };

      const newData = {
        ...data,
        columns: {
          ...data.columns,
          [newColumn.id]: newColumn,
        },
      };

      setData(newData);
      return;
    }
    
    // Moving from one list to another
    const startLeadIds = Array.from(startColumn.leadIds);
    startLeadIds.splice(source.index, 1);
    const newStart = {
      ...startColumn,
      leadIds: startLeadIds,
    };

    const finishLeadIds = Array.from(finishColumn.leadIds);
    finishLeadIds.splice(destination.index, 0, draggableId);
    const newFinish = {
      ...finishColumn,
      leadIds: finishLeadIds,
    };
    
    const movedLead = data.leads[draggableId];
    movedLead.status = destination.droppableId as LeadStatus;

    const newData: KanbanData = {
      ...data,
      leads: {
        ...data.leads,
        [draggableId]: movedLead,
      },
      columns: {
        ...data.columns,
        [newStart.id]: newStart,
        [newFinish.id]: newFinish,
      },
    };

    setData(newData);
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex gap-4 overflow-x-auto p-4 h-full">
        {data.columnOrder.map(columnId => {
          const column = data.columns[columnId];
          const leads = column.leadIds.map(leadId => data.leads[leadId]);
          return <KanbanColumn key={column.id} columnId={column.id} title={column.title} leads={leads} />;
        })}
      </div>
    </DragDropContext>
  );
};
