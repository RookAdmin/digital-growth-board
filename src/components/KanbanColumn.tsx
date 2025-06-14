
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
    <div className="flex flex-col w-80 bg-secondary rounded-lg p-2 flex-shrink-0">
        <h3 className="font-bold p-2 mb-2 text-primary-foreground">{title} ({leads.length})</h3>
        <Droppable droppableId={columnId}>
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={`flex-grow min-h-[100px] rounded-lg transition-colors p-2 ${snapshot.isDraggingOver ? 'bg-muted' : ''}`}
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
