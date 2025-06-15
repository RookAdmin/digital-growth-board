import { Lead } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Draggable } from '@hello-pangea/dnd';
import { Mail, Phone, Briefcase } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from "sonner";
import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useNavigate } from 'react-router-dom';

interface KanbanCardProps {
  lead: Lead;
  index: number;
  onCardClick: (lead: Lead) => void;
}

const statusColors: { [key in Lead['status']]: string } = {
  New: "bg-gray-500 hover:bg-gray-500",
  Contacted: "bg-blue-500 hover:bg-blue-500",
  Qualified: "bg-yellow-500 hover:bg-yellow-500",
  "Proposal Sent": "bg-purple-500 hover:bg-purple-500",
  Converted: "bg-green-500 hover:bg-green-500",
  Dropped: "bg-red-500 hover:bg-red-500",
};

export const KanbanCard = ({ lead, index, onCardClick }: KanbanCardProps) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const convertToClientMutation = useMutation({
    mutationFn: async (leadToConvert: Lead) => {
      // 1. Check if a client with this email already exists
      const { data: existingClient, error: checkError } = await supabase
        .from('clients')
        .select('*')
        .eq('email', leadToConvert.email)
        .maybeSingle();

      if (checkError) throw checkError;

      if (existingClient) {
        // Client already exists. Just update the lead status.
        const { error: leadError } = await supabase
          .from('leads')
          .update({ status: 'Converted' })
          .eq('id', leadToConvert.id);

        if (leadError) throw leadError;
        
        return { ...existingClient, wasExisting: true };
      }

      // 2. If client does not exist, create a new one.
      const { data: clientData, error: clientError } = await supabase.from('clients').insert({
        name: leadToConvert.name,
        email: leadToConvert.email,
        phone: leadToConvert.phone,
        business_name: leadToConvert.business_name,
        lead_id: leadToConvert.id,
        services_interested: leadToConvert.services_interested,
        budget_range: leadToConvert.budget_range,
      }).select().single();

      if (clientError) throw clientError;

      // 3. Create a project for the new client
      const { error: projectError } = await supabase.from('projects').insert({
        client_id: clientData.id,
        name: `${clientData.business_name || clientData.name}'s Initial Project`,
        description: `Project created from lead conversion. Services of interest: ${leadToConvert.services_interested?.join(', ') || 'Not specified'}.`,
        status: 'Not Started',
      });

      if (projectError) {
        console.error('Failed to create project for new client:', projectError);
        toast.error(`Client created, but failed to create project: ${projectError.message}`);
        // We still proceed even if project creation fails.
      }

      // 4. Update lead status
      const { error: leadError } = await supabase
        .from('leads')
        .update({ status: 'Converted' })
        .eq('id', leadToConvert.id);

      if (leadError) {
        console.error('Failed to update lead status, but client and project were created:', clientData);
        throw leadError;
      }
      return { ...clientData, wasExisting: false };
    },
    onSuccess: (data) => {
      const { wasExisting, ...client } = data;

      if (wasExisting) {
        toast.info(`Client with email ${client.email} already exists. Lead status updated.`);
      } else {
        toast.success("Lead converted to client and initial project created!");
        queryClient.invalidateQueries({ queryKey: ['projects'] });
      }

      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      
      navigate(`/clients?onboarding=${client.id}`);
    },
    onError: (error: Error) => {
      toast.error(`Conversion failed: ${error.message}`);
    },
  });

  const handleConfirmConversion = (e: React.MouseEvent) => {
    e.stopPropagation();
    convertToClientMutation.mutate(lead);
    setIsConfirmOpen(false);
  };
  
  const handleOpenDialog = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsConfirmOpen(true);
  }

  return (
    <Draggable draggableId={lead.id} index={index}>
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className="mb-4"
          onClick={() => onCardClick(lead)}
        >
          <Card className="hover:bg-accent transition-colors cursor-pointer">
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
                 <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
                    <Button
                      className="w-full"
                      size="sm"
                      onClick={handleOpenDialog}
                      disabled={convertToClientMutation.isPending}
                    >
                      {convertToClientMutation.isPending ? 'Converting...' : 'Convert to Client'}
                    </Button>
                  <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will convert "{lead.name}" into a client. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleConfirmConversion}>
                        Confirm
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </Draggable>
  );
};
