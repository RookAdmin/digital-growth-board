
import { Lead } from '@/types';
import { KanbanCard } from './KanbanCard';
import { Droppable } from '@hello-pangea/dnd';

interface KanbanColumnProps {
  columnId: string;
  title: string;
  leads: Lead[];
  onCardClick: (lead: Lead) => void;
}

export const KanbanColumn = ({ columnId, title, leads, onCardClick }: KanbanColumnProps) => {
  return (
    <div className="flex flex-col w-80 bg-background border border-border rounded-lg flex-shrink-0">
        <div className="px-4 py-3 border-b border-border">
            <h3 className="font-semibold text-foreground">{title} ({leads.length})</h3>
        </div>
        <Droppable droppableId={columnId}>
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={`flex-grow min-h-[100px] rounded-b-lg transition-colors p-2 ${snapshot.isDraggingOver ? 'bg-muted/20' : ''}`}
            >
              {leads.map((lead, index) => (
                <KanbanCard key={lead.id} lead={lead} index={index} onCardClick={onCardClick} />
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
    </div>
  );
};
