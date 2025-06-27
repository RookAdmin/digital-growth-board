
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
    <div className="flex flex-col w-80 bg-white border border-gray-200 rounded-xl shadow-sm flex-shrink-0">
        <div className="px-4 py-3 border-b border-gray-200 flex-shrink-0 bg-gray-50 rounded-t-xl">
            <h3 className="font-semibold text-gray-900">{title} ({leads.length})</h3>
        </div>
        <Droppable droppableId={columnId}>
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={`flex-1 rounded-b-xl transition-colors p-2 ${snapshot.isDraggingOver ? 'bg-gray-50' : 'bg-white'}`}
              style={{ minHeight: '200px' }}
            >
              <div className="space-y-3">
                {leads.map((lead, index) => (
                  <KanbanCard key={lead.id} lead={lead} index={index} onCardClick={onCardClick} />
                ))}
                {provided.placeholder}
              </div>
            </div>
          )}
        </Droppable>
    </div>
  );
};
