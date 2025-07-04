
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { 
  FileUp, 
  MessageSquare, 
  CheckSquare, 
  Settings, 
  Plus, 
  FileX,
  MessageCircle,
  Edit,
  User
} from 'lucide-react';

interface LeadActivityLogProps {
  leadId: string;
}

interface ActivityLogEntry {
  id: string;
  activity_type: string;
  description: string;
  user_name: string;
  user_email: string;
  created_at: string;
  metadata?: Record<string, any>;
}

const getActivityIcon = (activityType: string) => {
  switch (activityType) {
    case 'lead_created':
      return <Plus className="h-4 w-4" />;
    case 'lead_updated':
      return <Edit className="h-4 w-4" />;
    case 'status_changed':
      return <CheckSquare className="h-4 w-4" />;
    case 'note_added':
      return <MessageSquare className="h-4 w-4" />;
    case 'file_uploaded':
      return <FileUp className="h-4 w-4" />;
    case 'comment_added':
      return <MessageCircle className="h-4 w-4" />;
    default:
      return <Settings className="h-4 w-4" />;
  }
};

const getActivityColor = (activityType: string) => {
  switch (activityType) {
    case 'lead_created':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'lead_updated':
      return 'bg-yellow-50 text-yellow-700 border-yellow-200';
    case 'status_changed':
      return 'bg-green-50 text-green-700 border-green-200';
    case 'note_added':
      return 'bg-purple-50 text-purple-700 border-purple-200';
    case 'file_uploaded':
      return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    case 'comment_added':
      return 'bg-orange-50 text-orange-700 border-orange-200';
    default:
      return 'bg-gray-50 text-gray-700 border-gray-200';
  }
};

const formatActivityType = (activityType: string) => {
  return activityType
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export const LeadActivityLog = ({ leadId }: LeadActivityLogProps) => {
  const { data: activities = [], isLoading } = useQuery({
    queryKey: ['lead-activity-logs', leadId],
    queryFn: async () => {
      // For now, we'll fetch from lead_status_history and lead_notes
      // In a real implementation, you'd have a dedicated activity_logs table for leads
      const [statusHistory, notes] = await Promise.all([
        supabase
          .from('lead_status_history')
          .select(`
            *,
            team_members!inner(name, email)
          `)
          .eq('lead_id', leadId)
          .order('changed_at', { ascending: false }),
        supabase
          .from('lead_notes')
          .select('*')
          .eq('lead_id', leadId)
          .order('created_at', { ascending: false })
      ]);

      const activities: ActivityLogEntry[] = [];

      // Add status changes
      if (statusHistory.data) {
        statusHistory.data.forEach(history => {
          activities.push({
            id: `status_${history.id}`,
            activity_type: 'status_changed',
            description: history.old_status 
              ? `Changed status from ${history.old_status} to ${history.new_status}`
              : `Set status to ${history.new_status}`,
            user_name: (history as any).team_members?.name || 'Unknown User',
            user_email: (history as any).team_members?.email || '',
            created_at: history.changed_at,
            metadata: { notes: history.notes }
          });
        });
      }

      // Add notes
      if (notes.data) {
        notes.data.forEach(note => {
          activities.push({
            id: `note_${note.id}`,
            activity_type: 'note_added',
            description: `Added a new note: ${note.note.substring(0, 50)}${note.note.length > 50 ? '...' : ''}`,
            user_name: 'System User', // You'd get this from the actual user who added the note
            user_email: '',
            created_at: note.created_at
          });
        });
      }

      // Sort by date
      return activities.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    },
    enabled: !!leadId
  });

  if (isLoading) {
    return (
      <div className="space-y-3 h-full flex flex-col">
        <h4 className="font-semibold text-lg shrink-0">Activity Log</h4>
        <div className="flex items-center justify-center flex-1">
          <div className="text-sm text-gray-500">Loading activity log...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 h-full flex flex-col">
      <h4 className="font-semibold text-lg shrink-0">Activity Log</h4>
      <ScrollArea className="flex-1 pr-4">
        <div className="space-y-4">
          {activities.length === 0 ? (
            <div className="text-center text-gray-500 text-sm py-8">
              No activities yet.
            </div>
          ) : (
            activities.map((activity, index) => (
              <div key={activity.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className={`p-2 rounded-full border ${getActivityColor(activity.activity_type)}`}>
                    {getActivityIcon(activity.activity_type)}
                  </div>
                  {index < activities.length - 1 && (
                    <div className="w-px h-8 bg-gray-200 mt-2" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0 pb-4 bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="secondary" className={`${getActivityColor(activity.activity_type)} border`}>
                      {formatActivityType(activity.activity_type)}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      {format(new Date(activity.created_at), 'MMM d, h:mm a')}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-800 mb-1">{activity.description}</p>
                  
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <User className="h-3 w-3" />
                    <span>by {activity.user_name}</span>
                  </div>
                  
                  {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                    <div className="mt-2 text-xs text-gray-600 bg-gray-50 rounded p-2 border">
                      {Object.entries(activity.metadata).map(([key, value]) => (
                        value && (
                          <div key={key}>
                            <span className="font-medium">{key}:</span> {String(value)}
                          </div>
                        )
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
