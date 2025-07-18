
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { LeadStatusHistory } from '@/types';
import { format } from 'date-fns';
import { Clock, ArrowRight, User } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface LeadStatusHistoryProps {
  leadId: string;
}

const fetchLeadStatusHistory = async (leadId: string): Promise<LeadStatusHistory[]> => {
  const { data, error } = await supabase
    .from('lead_status_history')
    .select(`
      *,
      team_members!inner(name, email)
    `)
    .eq('lead_id', leadId)
    .order('changed_at', { ascending: false });
  
  if (error) throw new Error(error.message);
  return data as LeadStatusHistory[];
};

export const LeadStatusHistoryComponent = ({ leadId }: LeadStatusHistoryProps) => {
  const { data: statusHistory, isLoading, error } = useQuery({
    queryKey: ['lead-status-history', leadId],
    queryFn: () => fetchLeadStatusHistory(leadId),
    enabled: !!leadId,
  });

  console.log('LeadStatusHistory - leadId:', leadId);
  console.log('LeadStatusHistory - data:', statusHistory);
  console.log('LeadStatusHistory - isLoading:', isLoading);
  console.log('LeadStatusHistory - error:', error);

  if (isLoading) {
    return (
      <div className="space-y-3 h-full flex flex-col bg-white">
        <h4 className="font-semibold text-lg shrink-0">Status History</h4>
        <div className="text-sm text-muted-foreground">Loading status history...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-3 h-full flex flex-col bg-white">
        <h4 className="font-semibold text-lg shrink-0">Status History</h4>
        <div className="text-sm text-red-500">Error loading status history: {error.message}</div>
      </div>
    );
  }

  if (!statusHistory || statusHistory.length === 0) {
    return (
      <div className="space-y-3 h-full flex flex-col bg-white">
        <h4 className="font-semibold text-lg shrink-0">Status History</h4>
        <div className="text-sm text-muted-foreground">No status changes recorded yet.</div>
      </div>
    );
  }

  return (
    <div className="space-y-3 h-full flex flex-col bg-white">
      <h4 className="font-semibold text-lg shrink-0">Status History</h4>
      <ScrollArea className="flex-1 pr-4">
        <div className="space-y-3">
          {statusHistory.map((history) => (
            <div key={history.id} className="flex items-start gap-3 text-sm p-3 bg-gray-50 rounded-lg border-l-2 border-l-primary/20">
              <Clock className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
              <div className="flex-1 space-y-1 min-w-0">
                <div className="flex items-center gap-2 font-medium flex-wrap">
                  {history.old_status ? (
                    <>
                      <span className="px-2 py-1 bg-gray-200 text-gray-800 rounded text-xs">{history.old_status}</span>
                      <ArrowRight className="h-3 w-3 text-muted-foreground" />
                      <span className="px-2 py-1 bg-gray-200 text-gray-800 rounded text-xs">{history.new_status}</span>
                    </>
                  ) : (
                    <span className="px-2 py-1 bg-gray-200 text-gray-800 rounded text-xs">Set to {history.new_status}</span>
                  )}
                </div>
                <div className="text-muted-foreground text-xs">
                  {format(new Date(history.changed_at), 'MMM dd, yyyy • h:mm a')}
                </div>
                {(history as any).team_members && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <User className="h-3 w-3" />
                    <span>Changed by {(history as any).team_members.name}</span>
                  </div>
                )}
                {history.notes && (
                  <div className="text-xs italic text-muted-foreground mt-1">
                    {history.notes}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};
