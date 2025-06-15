
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { supabase } from '@/integrations/supabase/client';
import { Task, TaskStatus, TaskPriority } from '@/types';
import { TaskComments } from './TaskComments';
import { format } from 'date-fns';
import { Calendar, Users, AlertTriangle, CheckCircle, Clock, Milestone, MessageSquare, ChevronDown, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { AddTaskForm } from './AddTaskForm';

interface TaskTrackerProps {
  projectId: string;
}

const getStatusColor = (status: TaskStatus) => {
  switch (status) {
    case 'Not Started':
      return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    case 'In Progress':
      return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
    case 'Completed':
      return 'bg-green-100 text-green-800 hover:bg-green-200';
    case 'Blocked':
      return 'bg-red-100 text-red-800 hover:bg-red-200';
    default:
      return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
  }
};

const getPriorityColor = (priority: TaskPriority) => {
  switch (priority) {
    case 'urgent':
      return 'text-red-600';
    case 'high':
      return 'text-orange-600';
    case 'medium':
      return 'text-yellow-600';
    case 'low':
      return 'text-green-600';
    default:
      return 'text-gray-600';
  }
};

const getPriorityIcon = (priority: TaskPriority) => {
  switch (priority) {
    case 'urgent':
      return <AlertTriangle className="h-4 w-4" />;
    case 'high':
      return <AlertTriangle className="h-4 w-4" />;
    case 'medium':
      return <Clock className="h-4 w-4" />;
    case 'low':
      return <Clock className="h-4 w-4" />;
    default:
      return <Clock className="h-4 w-4" />;
  }
};

export const TaskTracker = ({ projectId }: TaskTrackerProps) => {
  const queryClient = useQueryClient();
  const [loadingTaskId, setLoadingTaskId] = useState<string | null>(null);
  const [openComments, setOpenComments] = useState<string | null>(null);
  const [isAddingTask, setIsAddingTask] = useState(false);

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('project_id', projectId)
        .order('type', { ascending: false }) // milestones first
        .order('due_date', { ascending: true });

      if (error) throw error;
      return data as Task[];
    }
  });

  const updateTaskStatus = useMutation({
    mutationFn: async ({ taskId, status }: { taskId: string; status: TaskStatus }) => {
      const { data, error } = await supabase
        .from('tasks')
        .update({ status })
        .eq('id', taskId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
      toast.success('Task status updated');
    },
    onError: (error) => {
      toast.error('Failed to update task status');
      console.error('Task update error:', error);
    },
    onSettled: () => {
      setLoadingTaskId(null);
    }
  });

  // Set up real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('task-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `project_id=eq.${projectId}`
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, queryClient]);

  const handleTaskStatusChange = async (taskId: string, checked: boolean) => {
    setLoadingTaskId(taskId);
    const newStatus: TaskStatus = checked ? 'Completed' : 'Not Started';
    updateTaskStatus.mutate({ taskId, status: newStatus });
  };

  const toggleComments = (taskId: string) => {
    setOpenComments(openComments === taskId ? null : taskId);
  };

  const milestones = tasks.filter(task => task.type === 'milestone');
  const regularTasks = tasks.filter(task => task.type === 'task');

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-muted-foreground">Loading tasks...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Milestones Section */}
      {milestones.length > 0 && (
        <Card className="border-l-4 border-l-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Milestone className="h-5 w-5 text-primary" />
              Project Milestones
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {milestones.map((milestone) => (
              <div key={milestone.id} className="space-y-2">
                <div className="flex items-start gap-4 p-4 bg-gradient-to-r from-primary/5 to-transparent rounded-lg border animate-fade-in hover-scale">
                  <Checkbox
                    checked={milestone.status === 'Completed'}
                    onCheckedChange={(checked) => handleTaskStatusChange(milestone.id, Boolean(checked))}
                    disabled={loadingTaskId === milestone.id}
                    className="mt-1"
                  />
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{milestone.title}</h4>
                      <div className="flex items-center gap-2">
                        <div className={`flex items-center gap-1 ${getPriorityColor(milestone.priority)}`}>
                          {getPriorityIcon(milestone.priority)}
                          <span className="text-xs font-medium">{milestone.priority}</span>
                        </div>
                        <Badge className={getStatusColor(milestone.status)} variant="secondary">
                          {milestone.status === 'Completed' ? <CheckCircle className="mr-1 h-3 w-3" /> : null}
                          {milestone.status}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleComments(milestone.id)}
                        >
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    {milestone.description && (
                      <p className="text-sm text-muted-foreground">{milestone.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      {milestone.due_date && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(milestone.due_date), 'MMM dd, yyyy')}
                        </div>
                      )}
                      {milestone.assigned_team_members && milestone.assigned_team_members.length > 0 && (
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {milestone.assigned_team_members.length} member{milestone.assigned_team_members.length !== 1 ? 's' : ''}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <Collapsible open={openComments === milestone.id}>
                  <CollapsibleContent>
                    <div className="mt-2 ml-4">
                      <TaskComments taskId={milestone.id} taskTitle={milestone.title} />
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Tasks Section */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Project Tasks</CardTitle>
              <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                <span>Total: {regularTasks.length}</span>
                <span>Completed: {regularTasks.filter(t => t.status === 'Completed').length}</span>
                <span>In Progress: {regularTasks.filter(t => t.status === 'In Progress').length}</span>
              </div>
            </div>
            {!isAddingTask && (
              <Button onClick={() => setIsAddingTask(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Task
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isAddingTask && (
            <div className="mb-6">
              <AddTaskForm projectId={projectId} onCancel={() => setIsAddingTask(false)} />
            </div>
          )}
          {regularTasks.length === 0 && !isAddingTask ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No tasks found for this project.</p>
              <p className="text-sm text-muted-foreground mt-2">Click "Add Task" to get started.</p>
            </div>
          ) : regularTasks.length > 0 ? (
            <div className="space-y-3">
              {regularTasks.map((task) => (
                <div key={task.id} className="space-y-2">
                  <div className="flex items-start gap-4 p-3 border rounded-lg hover:bg-muted/30 transition-colors animate-fade-in">
                    <Checkbox
                      checked={task.status === 'Completed'}
                      onCheckedChange={(checked) => handleTaskStatusChange(task.id, Boolean(checked))}
                      disabled={loadingTaskId === task.id}
                      className="mt-1"
                    />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className={`font-medium ${task.status === 'Completed' ? 'line-through text-muted-foreground' : ''}`}>
                          {task.title}
                        </h4>
                        <div className="flex items-center gap-2">
                          <div className={`flex items-center gap-1 ${getPriorityColor(task.priority)}`}>
                            {getPriorityIcon(task.priority)}
                            <span className="text-xs font-medium">{task.priority}</span>
                          </div>
                          <Badge className={getStatusColor(task.status)} variant="secondary">
                            {task.status === 'Completed' ? <CheckCircle className="mr-1 h-3 w-3" /> : null}
                            {task.status}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleComments(task.id)}
                          >
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      {task.description && (
                        <p className="text-sm text-muted-foreground">{task.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        {task.due_date && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(task.due_date), 'MMM dd, yyyy')}
                          </div>
                        )}
                        {task.assigned_team_members && task.assigned_team_members.length > 0 && (
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {task.assigned_team_members.length} member{task.assigned_team_members.length !== 1 ? 's' : ''}
                          </div>
                        )}
                        {task.completed_at && (
                          <div className="text-green-600">
                            Completed {format(new Date(task.completed_at), 'MMM dd, yyyy')}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <Collapsible open={openComments === task.id}>
                    <CollapsibleContent>
                      <div className="mt-2 ml-4">
                        <TaskComments taskId={task.id} taskTitle={task.title} />
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
};
