import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const addTaskSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters." }).max(18, { message: "Title must be at most 18 characters." }),
  description: z.string().max(150, { message: "Description must be at most 150 characters." }).optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  due_date: z.date().optional(),
});

type AddTaskFormValues = z.infer<typeof addTaskSchema>;

interface AddTaskFormProps {
  projectId: string;
  onCancel: () => void;
}

export const AddTaskForm = ({ projectId, onCancel }: AddTaskFormProps) => {
  const queryClient = useQueryClient();
  const form = useForm<AddTaskFormValues>({
    resolver: zodResolver(addTaskSchema),
    defaultValues: {
      title: "",
      description: "",
      priority: "medium",
    },
  });

  const addTaskMutation = useMutation({
    mutationFn: async (data: AddTaskFormValues) => {
      const { data: taskData, error } = await supabase.from('tasks').insert({
        project_id: projectId,
        title: data.title,
        description: data.description || null,
        priority: data.priority,
        due_date: data.due_date ? data.due_date.toISOString() : null,
        status: 'Not Started',
        type: 'task',
        assigned_team_members: [],
      }).select().single();
      
      if (error) throw error;

      // Log activity for task creation
      const { data: { user } } = await supabase.auth.getUser();
      if (user && taskData) {
        await supabase.from('activity_logs').insert({
          project_id: projectId,
          activity_type: 'task_created',
          user_name: user.user_metadata?.full_name || user.email || 'Unknown User',
          user_email: user.email || '',
          description: `Task "${taskData.title}" created`,
          metadata: {
            task_id: taskData.id,
            task_title: taskData.title,
            priority: taskData.priority
          }
        });
      }

      return taskData;
    },
    onSuccess: () => {
      toast.success("Task added successfully!");
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['activity-logs'] });
      form.reset();
      onCancel();
    },
    onError: (error) => {
      toast.error("Failed to add task.");
      console.error(error);
    },
  });

  const onSubmit = (data: AddTaskFormValues) => {
    addTaskMutation.mutate(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-4 border border-gray-200 rounded-xl bg-white animate-fade-in">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Task Title</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Design new landing page" {...field} maxLength={18} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (Optional)</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Add more details about the task" 
                  {...field} 
                  value={field.value || ''} 
                  maxLength={150}
                  className="resize-none"
                  rows={3}
                />
              </FormControl>
              <div className="text-xs text-muted-foreground">
                {(field.value || '').length}/150 characters
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Priority</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="due_date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Due Date (Optional)</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="flex justify-end gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel}
              className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-xl"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={addTaskMutation.isPending}
              className="bg-gray-900 text-white hover:bg-gray-800 hover:text-white rounded-xl"
            >
              {addTaskMutation.isPending ? 'Adding Task...' : 'Add Task'}
            </Button>
        </div>
      </form>
    </Form>
  );
};
