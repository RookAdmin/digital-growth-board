
import { Lead } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Draggable } from '@hello-pangea/dnd';
import { Mail, Phone } from 'lucide-react';

interface KanbanCardProps {
  lead: Lead;
  index: number;
}

const statusColors: { [key in Lead['status']]: string } = {
  New: "bg-blue-500 hover:bg-blue-500",
  Contacted: "bg-cyan-500 hover:bg-cyan-500",
  Qualified: "bg-yellow-500 hover:bg-yellow-500",
  "Proposal Sent": "bg-orange-500 hover:bg-orange-500",
  Converted: "bg-green-500 hover:bg-green-500",
  Dropped: "bg-red-500 hover:bg-red-500",
};

export const KanbanCard = ({ lead, index }: KanbanCardProps) => {
  return (
    <Draggable draggableId={lead.id} index={index}>
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className="mb-4"
        >
          <Card>
            <CardHeader className="p-4">
              <div className="flex justify-between items-start">
                <CardTitle className="text-base font-bold">{lead.name}</CardTitle>
                <Badge className={`${statusColors[lead.status]} text-white`}>{lead.status}</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0 text-sm text-muted-foreground">
              <div className="flex items-center gap-2 mb-2">
                <Mail size={14} /> <span>{lead.email}</span>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <Phone size={14} /> <span>{lead.phone}</span>
              </div>
              <p className="mb-2"><strong>Source:</strong> {lead.source}</p>
              {lead.budget && <p className="mb-4"><strong>Budget:</strong> {lead.budget}</p>}
              {lead.status !== 'Converted' && lead.status !== 'Dropped' && (
                 <Button className="w-full" size="sm">Convert to Client</Button>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </Draggable>
  );
};
