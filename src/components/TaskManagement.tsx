import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckSquare, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { Task } from '@/types';
import { AddTaskForm } from './AddTaskForm';
import { TaskComments } from './TaskComments';

interface TaskManagementProps {
  projectId: string;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Not Started':
      return 'bg-slate-100 text-slate-700 border-slate-200';
    case 'In Progress':
      return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'Completed':
      return 'bg-green-100 text-green-700 border-green-200';
    case 'Blocked':
      return 'bg-red-100 text-red-700 border-red-200';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'urgent':
    case 'high':
      return 'bg-red-100 text-red-700';
    case 'medium':
      return 'bg-yellow-100 text-yellow-700';
    case 'low':
      return 'bg-green-100 text-green-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
};

export const TaskManagement = ({ projectId }: TaskManagementProps) => {
  const [showAddTask, setShowAddTask] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Task[];
    }
  });

  const completedTasks = tasks.filter(t => t.status === 'Completed').length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CheckSquare className="w-5 h-5" />
            Tasks
            <Badge variant="secondary">
              {completedTasks}/{tasks.length} completed
            </Badge>
          </CardTitle>
          <Button
            onClick={() => setShowAddTask(!showAddTask)}
            size="sm"
            className="bg-black text-white hover:bg-gray-800"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Task
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {showAddTask && (
          <AddTaskForm
            projectId={projectId}
            onCancel={() => setShowAddTask(false)}
          />
        )}

        {isLoading ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-black mx-auto"></div>
          </div>
        ) : tasks.length > 0 ? (
          <div className="space-y-3">
            {tasks.map((task) => (
              <div key={task.id} className="border border-gray-200 rounded-lg p-4 bg-white hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h5 className="font-medium text-gray-900">{task.title}</h5>
                      <Badge className={`${getStatusColor(task.status)} text-xs`} variant="outline">
                        {task.status}
                      </Badge>
                      <Badge className={`${getPriorityColor(task.priority)} text-xs`}>
                        {task.priority}
                      </Badge>
                    </div>
                    {task.description && (
                      <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>Created: {format(new Date(task.created_at), 'MMM dd, yyyy')}</span>
                      {task.due_date && (
                        <span>Due: {format(new Date(task.due_date), 'MMM dd, yyyy')}</span>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedTask(selectedTask?.id === task.id ? null : task)}
                    className="ml-4"
                  >
                    {selectedTask?.id === task.id ? 'Hide Comments' : 'Comments'}
                  </Button>
                </div>
                
                {selectedTask?.id === task.id && (
                  <div className="mt-4 border-t pt-4">
                    <TaskComments taskId={task.id} taskTitle={task.title} />
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">No tasks assigned to this project yet.</p>
        )}
      </CardContent>
    </Card>
  );
};