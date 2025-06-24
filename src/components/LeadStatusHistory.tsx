
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { LeadStatusHistory } from '@/types';
import { format } from 'date-fns';
import { Clock, User } from 'lucide-react';

interface LeadStatusHistoryProps {
  leadId: string;
}

const fetchLeadStatusHistory = async (leadId: string): Promise<LeadStatusHistory[]> => {
  const { data, error } = await supabase
    .from('lead_status_history')
    .select('*')
    .eq('lead_id', leadId)
    .order('changed_at', { ascending: false });
  
  if (error) throw new Error(error.message);
  return data as LeadStatusHistory[];
};

export const LeadStatusHistory = ({ leadId }: LeadStatusHistoryProps) => {
  const { data: statusHistory, isLoading } = useQuery({
    queryKey: ['lead-status-history', leadId],
    queryFn: () => fetchLeadStatusHistory(leadId),
    enabled: !!leadId,
  });

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading status history...</div>;
  }

  if (!statusHistory || statusHistory.length === 0) {
    return <div className="text-sm text-muted-foreground">No status changes recorded yet.</div>;
  }

  return (
    <div className="space-y-3">
      <h4 className="font-medium text-sm">Status Change History</h4>
      <div className="space-y-2 max-h-40 overflow-y-auto">
        {statusHistory.map((history) => (
          <div key={history.id} className="flex items-start gap-2 text-xs p-2 bg-muted/50 rounded">
            <Clock className="h-3 w-3 mt-0.5 text-muted-foreground flex-shrink-0" />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">
                  {history.old_status ? `${history.old_status} → ${history.new_status}` : `Set to ${history.new_status}`}
                </span>
              </div>
              <div className="text-muted-foreground">
                {format(new Date(history.changed_at), 'MMM dd, yyyy HH:mm')}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
