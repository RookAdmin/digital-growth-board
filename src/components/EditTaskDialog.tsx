import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { CalendarIcon, Users, Upload, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { TaskActivityLog } from '@/components/TaskActivityLog';

const editTaskSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters." }).max(18, { message: "Title must be at most 18 characters." }),
  type: z.enum(["new", "bug", "testing", "task", "milestone"]),
  description: z.string().max(150, { message: "Description must be at most 150 characters." }).optional(),
  remarks: z.string().max(200, { message: "Remarks must be at most 200 characters." }).optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  status: z.enum(["Not Started", "In Progress", "Review", "Completed"]),
  due_date: z.date().optional(),
  assigned_team_members: z.array(z.string()).default([]),
});

type EditTaskFormValues = z.infer<typeof editTaskSchema>;

interface EditTaskDialogProps {
  task: any;
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const EditTaskDialog = ({ task, projectId, isOpen, onClose }: EditTaskDialogProps) => {
  const queryClient = useQueryClient();
  const [selectedMembers, setSelectedMembers] = useState<string[]>(task?.assigned_team_members || []);
  const [descriptionImage, setDescriptionImage] = useState<File | null>(null);
  const [descriptionImagePreview, setDescriptionImagePreview] = useState<string | null>(task?.description_image_url || null);
  const [remarksImage, setRemarksImage] = useState<File | null>(null);
  const [remarksImagePreview, setRemarksImagePreview] = useState<string | null>(task?.remarks_image_url || null);

  const form = useForm<EditTaskFormValues>({
    resolver: zodResolver(editTaskSchema),
    defaultValues: {
      title: task?.title || "",
      type: task?.type || "new",
      description: task?.description || "",
      remarks: task?.remarks || "",
      priority: task?.priority || "medium",
      status: task?.status || "Not Started",
      due_date: task?.due_date ? new Date(task.due_date) : undefined,
      assigned_team_members: task?.assigned_team_members || [],
    },
  });

  // Reset form when task changes
  useEffect(() => {
    if (task) {
      form.reset({
        title: task.title,
        type: task.type || "new",
        description: task.description || "",
        remarks: task.remarks || "",
        priority: task.priority,
        status: task.status,
        due_date: task.due_date ? new Date(task.due_date) : undefined,
        assigned_team_members: task.assigned_team_members || [],
      });
      setSelectedMembers(task.assigned_team_members || []);
      setDescriptionImagePreview(task.description_image_url || null);
      setRemarksImagePreview(task.remarks_image_url || null);
    }
  }, [task, form]);

  // Fetch team members
  const { data: teamMembers } = useQuery({
    queryKey: ['team-members'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('team_members')
        .select('id, name, email, role')
        .eq('is_active', true);
      
      if (error) throw error;
      return data;
    },
  });

  const uploadImage = async (file: File, folder: string): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${folder}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('project-files')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('project-files')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
      return null;
    }
  };

  // Update task mutation
  const updateTaskMutation = useMutation({
    mutationFn: async (data: EditTaskFormValues) => {
      let descriptionImageUrl = descriptionImagePreview;
      let remarksImageUrl = remarksImagePreview;

      if (descriptionImage) {
        descriptionImageUrl = await uploadImage(descriptionImage, 'task-descriptions');
      }

      if (remarksImage) {
        remarksImageUrl = await uploadImage(remarksImage, 'task-remarks');
      }

      const { data: taskData, error } = await supabase
        .from('tasks')
        .update({
          title: data.title,
          type: data.type,
          description: data.description || null,
          description_image_url: descriptionImageUrl,
          remarks: data.remarks || null,
          remarks_image_url: remarksImageUrl,
          priority: data.priority,
          status: data.status,
          due_date: data.due_date ? data.due_date.toISOString() : null,
          assigned_team_members: selectedMembers,
        })
        .eq('id', task.id)
        .select()
        .single();
      
      if (error) throw error;

      // Log activity for task update
      const { data: { user } } = await supabase.auth.getUser();
      if (user && taskData) {
        await supabase.from('activity_logs').insert({
          project_id: projectId,
          activity_type: 'task_updated',
          user_name: user.user_metadata?.full_name || user.email || 'Unknown User',
          user_email: user.email || '',
          description: `Task "${taskData.title}" updated`,
          metadata: {
            task_id: taskData.id,
            task_title: taskData.title,
            status: taskData.status,
            assigned_members_count: selectedMembers.length
          }
        });
      }

      return taskData;
    },
    onSuccess: () => {
      toast.success("Task updated successfully!");
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
      queryClient.invalidateQueries({ queryKey: ['activity-logs'] });
      queryClient.invalidateQueries({ queryKey: ['task-activity-logs'] });
      onClose();
    },
    onError: (error) => {
      toast.error("Failed to update task.");
      console.error(error);
    },
  });

  const handleMemberToggle = (memberId: string, checked: boolean) => {
    if (checked) {
      setSelectedMembers(prev => [...prev, memberId]);
    } else {
      setSelectedMembers(prev => prev.filter(id => id !== memberId));
    }
  };

  const handleDescriptionImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setDescriptionImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setDescriptionImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemarksImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setRemarksImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setRemarksImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDescriptionPaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (items) {
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            setDescriptionImage(file);
            const reader = new FileReader();
            reader.onloadend = () => {
              setDescriptionImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
          }
        }
      }
    }
  };

  const handleRemarksPaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (items) {
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            setRemarksImage(file);
            const reader = new FileReader();
            reader.onloadend = () => {
              setRemarksImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
          }
        }
      }
    }
  };

  const onSubmit = (data: EditTaskFormValues) => {
    updateTaskMutation.mutate(data);
  };

  if (!task) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Task Title</FormLabel>
                    <FormControl>
                      <Input {...field} maxLength={18} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Task Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="bug">Bug</SelectItem>
                        <SelectItem value="testing">Testing</SelectItem>
                        <SelectItem value="task">Task</SelectItem>
                        <SelectItem value="milestone">Milestone</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      value={field.value || ''} 
                      maxLength={150}
                      onPaste={handleDescriptionPaste}
                      placeholder="You can paste images here"
                      rows={3}
                    />
                  </FormControl>
                  <div className="flex items-center gap-2">
                    <div className="text-xs text-muted-foreground">
                      {(field.value || '').length}/150 characters
                    </div>
                    <label htmlFor="edit-description-image" className="cursor-pointer">
                      <Upload className="w-4 h-4 text-gray-600 hover:text-black" />
                      <input
                        id="edit-description-image"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleDescriptionImageChange}
                      />
                    </label>
                  </div>
                  {descriptionImagePreview && (
                    <div className="relative mt-2">
                      <img src={descriptionImagePreview} alt="Description preview" className="max-w-xs rounded border" />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute top-1 right-1 bg-white"
                        onClick={() => {
                          setDescriptionImage(null);
                          setDescriptionImagePreview(null);
                        }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="remarks"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Remarks</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      value={field.value || ''} 
                      maxLength={200}
                      onPaste={handleRemarksPaste}
                      placeholder="You can paste images here"
                      rows={3}
                    />
                  </FormControl>
                  <div className="flex items-center gap-2">
                    <div className="text-xs text-muted-foreground">
                      {(field.value || '').length}/200 characters
                    </div>
                    <label htmlFor="edit-remarks-image" className="cursor-pointer">
                      <Upload className="w-4 h-4 text-gray-600 hover:text-black" />
                      <input
                        id="edit-remarks-image"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleRemarksImageChange}
                      />
                    </label>
                  </div>
                  {remarksImagePreview && (
                    <div className="relative mt-2">
                      <img src={remarksImagePreview} alt="Remarks preview" className="max-w-xs rounded border" />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute top-1 right-1 bg-white"
                        onClick={() => {
                          setRemarksImage(null);
                          setRemarksImagePreview(null);
                        }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Not Started">Not Started</SelectItem>
                        <SelectItem value="In Progress">In Progress</SelectItem>
                        <SelectItem value="Review">Review</SelectItem>
                        <SelectItem value="Completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
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
            </div>

            <FormField
              control={form.control}
              name="due_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Due Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
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

            <div className="space-y-3">
              <FormLabel className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Assign Team Members
                {selectedMembers.length > 0 && (
                  <Badge variant="secondary">{selectedMembers.length} selected</Badge>
                )}
              </FormLabel>
              <div className="max-h-40 overflow-y-auto space-y-2 border rounded-md p-3">
                {teamMembers?.map((member) => (
                  <div key={member.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={member.id}
                      checked={selectedMembers.includes(member.id)}
                      onCheckedChange={(checked) => 
                        handleMemberToggle(member.id, checked as boolean)
                      }
                    />
                    <label
                      htmlFor={member.id}
                      className="flex-1 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      <div>{member.name}</div>
                      <div className="text-xs text-muted-foreground">{member.role}</div>
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t pt-4">
              <TaskActivityLog taskId={task.id} />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateTaskMutation.isPending}>
                {updateTaskMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};