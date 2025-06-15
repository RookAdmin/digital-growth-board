
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ActivityLog } from '@/types';
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
  Edit
} from 'lucide-react';

interface ProjectActivityLogProps {
  projectId: string;
}

const getActivityIcon = (activityType: string) => {
  switch (activityType) {
    case 'task_created':
      return <Plus className="h-4 w-4" />;
    case 'task_updated':
      return <Edit className="h-4 w-4" />;
    case 'task_completed':
      return <CheckSquare className="h-4 w-4" />;
    case 'file_uploaded':
      return <FileUp className="h-4 w-4" />;
    case 'file_deleted':
      return <FileX className="h-4 w-4" />;
    case 'message_sent':
      return <MessageSquare className="h-4 w-4" />;
    case 'project_updated':
      return <Settings className="h-4 w-4" />;
    case 'comment_added':
      return <MessageCircle className="h-4 w-4" />;
    default:
      return <Settings className="h-4 w-4" />;
  }
};

const getActivityColor = (activityType: string) => {
  switch (activityType) {
    case 'task_created':
      return 'bg-blue-100 text-blue-800';
    case 'task_updated':
      return 'bg-yellow-100 text-yellow-800';
    case 'task_completed':
      return 'bg-green-100 text-green-800';
    case 'file_uploaded':
      return 'bg-purple-100 text-purple-800';
    case 'file_deleted':
      return 'bg-red-100 text-red-800';
    case 'message_sent':
      return 'bg-indigo-100 text-indigo-800';
    case 'project_updated':
      return 'bg-gray-100 text-gray-800';
    case 'comment_added':
      return 'bg-orange-100 text-orange-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const formatActivityType = (activityType: string) => {
  return activityType
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export const ProjectActivityLog = ({ projectId }: ProjectActivityLogProps) => {
  const { data: activities = [], isLoading } = useQuery({
    queryKey: ['activity-logs', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ActivityLog[];
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-sm text-muted-foreground">Loading activity log...</div>
      </div>
    );
  }

  return (
    <ScrollArea className="h-96 pr-4">
      <div className="space-y-4">
        {activities.length === 0 ? (
          <div className="text-center text-muted-foreground text-sm py-8">
            No activities yet.
          </div>
        ) : (
          activities.map((activity, index) => (
            <div key={activity.id} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className={`p-2 rounded-full ${getActivityColor(activity.activity_type)}`}>
                  {getActivityIcon(activity.activity_type)}
                </div>
                {index < activities.length - 1 && (
                  <div className="w-px h-8 bg-border mt-2" />
                )}
              </div>
              
              <div className="flex-1 min-w-0 pb-4">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="secondary" className={getActivityColor(activity.activity_type)}>
                    {formatActivityType(activity.activity_type)}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(activity.created_at), 'MMM d, h:mm a')}
                  </span>
                </div>
                
                <p className="text-sm text-foreground mb-1">{activity.description}</p>
                
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>by {activity.user_name}</span>
                </div>
                
                {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                  <div className="mt-2 text-xs text-muted-foreground bg-muted rounded p-2">
                    {Object.entries(activity.metadata).map(([key, value]) => (
                      <div key={key}>
                        <span className="font-medium">{key}:</span> {String(value)}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </ScrollArea>
  );
};
