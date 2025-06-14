
import { Lead } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Draggable } from '@hello-pangea/dnd';
import { Mail, Phone, Briefcase } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from "sonner";

interface KanbanCardProps {
  lead: Lead;
  index: number;
}

const statusColors: { [key in Lead['status']]: string } = {
  New: "bg-gray-500 hover:bg-gray-500",
  Contacted: "bg-blue-500 hover:bg-blue-500",
  Qualified: "bg-yellow-500 hover:bg-yellow-500",
  "Proposal Sent": "bg-purple-500 hover:bg-purple-500",
  Converted: "bg-green-500 hover:bg-green-500",
  Dropped: "bg-red-500 hover:bg-red-500",
};

export const KanbanCard = ({ lead, index }: KanbanCardProps) => {
  const queryClient = useQueryClient();

  const convertToClientMutation = useMutation({
    mutationFn: async (leadToConvert: Lead) => {
      // 1. Create a client
      const { data: clientData, error: clientError } = await supabase.from('clients').insert({
        name: leadToConvert.name,
        email: leadToConvert.email,
        phone: leadToConvert.phone,
        business_name: leadToConvert.business_name,
        lead_id: leadToConvert.id,
      }).select().single();

      if (clientError) throw clientError;

      // 2. Update lead status
      const { error: leadError } = await supabase
        .from('leads')
        .update({ status: 'Converted' })
        .eq('id', leadToConvert.id);

      if (leadError) {
        // This is not a true transaction, so we'll just log an error if the second step fails.
        // A robust solution could use a database function (RPC) to ensure atomicity.
        console.error('Failed to update lead status, but client was created:', clientData);
        throw leadError;
      }
    },
    onSuccess: () => {
      toast.success("Lead converted to client!");
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
    onError: (error: Error) => {
      toast.error(`Conversion failed: ${error.message}`);
    },
  });

  const handleConvertToClient = () => {
    convertToClientMutation.mutate(lead);
  };

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
                <div className="flex-1 mr-2">
                  <CardTitle className="text-base font-bold">{lead.name}</CardTitle>
                  {lead.business_name && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      <Briefcase size={14} /> <span>{lead.business_name}</span>
                    </div>
                  )}
                </div>
                <Badge className={`${statusColors[lead.status]} text-white shrink-0`}>{lead.status}</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0 text-sm text-muted-foreground">
              <div className="flex items-center gap-2 mb-2">
                <Mail size={14} /> <span>{lead.email}</span>
              </div>
              {lead.phone && (
                <div className="flex items-center gap-2 mb-2">
                  <Phone size={14} /> <span>{lead.phone}</span>
                </div>
              )}
              {lead.lead_source && <p className="mb-2"><strong>Source:</strong> {lead.lead_source}</p>}
              {lead.budget_range && <p className="mb-4"><strong>Budget:</strong> {lead.budget_range}</p>}
              {lead.status !== 'Converted' && lead.status !== 'Dropped' && (
                 <Button
                    className="w-full"
                    size="sm"
                    onClick={handleConvertToClient}
                    disabled={convertToClientMutation.isPending}
                  >
                    {convertToClientMutation.isPending ? 'Converting...' : 'Convert to Client'}
                  </Button>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </Draggable>
  );
};
