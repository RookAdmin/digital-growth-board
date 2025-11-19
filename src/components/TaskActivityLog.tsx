import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ActivityLog } from '@/types';
import { format } from 'date-fns';
import { Activity } from 'lucide-react';

interface TaskActivityLogProps {
  taskId: string;
}

export const TaskActivityLog = ({ taskId }: TaskActivityLogProps) => {
  const { data: activities, isLoading } = useQuery({
    queryKey: ['task-activity-logs', taskId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('metadata->>task_id', taskId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ActivityLog[];
    },
  });

  if (isLoading) {
    return (
      <div className="text-xs text-gray-500 mt-2 pl-6">
        Loading activity...
      </div>
    );
  }

  if (!activities || activities.length === 0) {
    return null;
  }

  return (
    <div className="mt-3 pl-6 border-l-2 border-gray-200 space-y-2">
      <div className="flex items-center gap-2 text-xs font-medium text-gray-700 mb-2">
        <Activity className="w-3 h-3" />
        Activity Log
      </div>
      {activities.map((activity) => (
        <div key={activity.id} className="text-xs text-gray-600">
          <div className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 bg-[#131313] rounded-full mt-1.5" />
            <div className="flex-1">
              <p>{activity.description}</p>
              <p className="text-gray-400 mt-0.5">
                by {activity.user_name} • {format(new Date(activity.created_at), 'MMM dd, yyyy HH:mm')}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};