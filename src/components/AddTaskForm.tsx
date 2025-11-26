
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';
import { CalendarIcon, Upload, X, Users, Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { TaskType } from '@/types';

const addTaskSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters." }).max(18, { message: "Title must be at most 18 characters." }),
  type: z.enum(["new", "bug", "testing", "task", "milestone"]).default("new"),
  description: z.string().max(150, { message: "Description must be at most 150 characters." }).optional(),
  remarks: z.string().max(200, { message: "Remarks must be at most 200 characters." }).optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  due_date: z.date().optional(),
});

type AddTaskFormValues = z.infer<typeof addTaskSchema>;

interface AddTaskFormProps {
  projectId: string;
  onCancel: () => void;
  defaultType?: TaskType;
  hideTypeField?: boolean;
  typeLabel?: string;
  submitLabel?: string;
}

export const AddTaskForm = ({
  projectId,
  onCancel,
  defaultType = "new",
  hideTypeField = false,
  typeLabel = "Task Type",
  submitLabel = "Add Task"
}: AddTaskFormProps) => {
  const queryClient = useQueryClient();
  const [descriptionImage, setDescriptionImage] = useState<File | null>(null);
  const [descriptionImagePreview, setDescriptionImagePreview] = useState<string | null>(null);
  const [remarksImage, setRemarksImage] = useState<File | null>(null);
  const [remarksImagePreview, setRemarksImagePreview] = useState<string | null>(null);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [openMembersDropdown, setOpenMembersDropdown] = useState(false);

  const form = useForm<AddTaskFormValues>({
    resolver: zodResolver(addTaskSchema),
    defaultValues: {
      title: "",
      type: defaultType,
      description: "",
      remarks: "",
      priority: "medium",
    },
  });

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

      const { error: uploadError, data } = await supabase.storage
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

  const addTaskMutation = useMutation({
    mutationFn: async (data: AddTaskFormValues) => {
      let descriptionImageUrl = null;
      let remarksImageUrl = null;

      if (descriptionImage) {
        descriptionImageUrl = await uploadImage(descriptionImage, 'task-descriptions');
      }

      if (remarksImage) {
        remarksImageUrl = await uploadImage(remarksImage, 'task-remarks');
      }

      const { data: taskData, error } = await supabase.from('tasks').insert({
        project_id: projectId,
        title: data.title,
        type: data.type,
        description: data.description || null,
        description_image_url: descriptionImageUrl,
        remarks: data.remarks || null,
        remarks_image_url: remarksImageUrl,
        priority: data.priority,
        due_date: data.due_date ? data.due_date.toISOString() : null,
        status: 'Not Started',
        assigned_team_members: selectedMembers,
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
            task_type: taskData.type,
            priority: taskData.priority
          }
        });
      }

      return taskData;
    },
    onSuccess: () => {
      toast.success("Task added successfully!");
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['activity-logs'] });
      form.reset();
      setDescriptionImage(null);
      setDescriptionImagePreview(null);
      setRemarksImage(null);
      setRemarksImagePreview(null);
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

  const handleMemberToggle = (memberId: string) => {
    setSelectedMembers(prev => 
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  const getSelectedMemberNames = () => {
    if (!teamMembers) return '';
    return selectedMembers
      .map(id => teamMembers.find(m => m.id === id)?.name)
      .filter(Boolean)
      .join(', ');
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-4 border border-gray-200 rounded-xl bg-white animate-fade-in">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-black">Task Title</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="e.g., Design new landing page" 
                    {...field} 
                    maxLength={18} 
                    className="bg-white border-gray-300 text-black placeholder:text-gray-500"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {!hideTypeField && (
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-black">{typeLabel}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-white border-gray-300 text-black">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-white border-gray-300">
                      <SelectItem value="new" className="text-black hover:bg-gray-100">New</SelectItem>
                      <SelectItem value="bug" className="text-black hover:bg-gray-100">Bug</SelectItem>
                      <SelectItem value="testing" className="text-black hover:bg-gray-100">Testing</SelectItem>
                      <SelectItem value="task" className="text-black hover:bg-gray-100">Task</SelectItem>
                      <SelectItem value="milestone" className="text-black hover:bg-gray-100">Milestone</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-black">Description (Optional)</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Add more details about the task (You can paste images here)" 
                  {...field} 
                  value={field.value || ''} 
                  maxLength={150}
                  onPaste={handleDescriptionPaste}
                  className="resize-none bg-white border-gray-300 text-black placeholder:text-gray-500"
                  rows={3}
                />
              </FormControl>
              <div className="flex items-center gap-2">
                <div className="text-xs text-gray-600">
                  {(field.value || '').length}/150 characters
                </div>
                <label htmlFor="description-image" className="cursor-pointer">
                  <Upload className="w-4 h-4 text-gray-600 hover:text-black" />
                  <input
                    id="description-image"
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
              <FormLabel className="text-black">Remarks (Optional)</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Add remarks or notes (You can paste images here)" 
                  {...field} 
                  value={field.value || ''} 
                  maxLength={200}
                  onPaste={handleRemarksPaste}
                  className="resize-none bg-white border-gray-300 text-black placeholder:text-gray-500"
                  rows={3}
                />
              </FormControl>
              <div className="flex items-center gap-2">
                <div className="text-xs text-gray-600">
                  {(field.value || '').length}/200 characters
                </div>
                <label htmlFor="remarks-image" className="cursor-pointer">
                  <Upload className="w-4 h-4 text-gray-600 hover:text-black" />
                  <input
                    id="remarks-image"
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
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-black">Priority</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="bg-white border-gray-300 text-black">
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-white border-gray-300">
                    <SelectItem value="low" className="text-black hover:bg-gray-100">Low</SelectItem>
                    <SelectItem value="medium" className="text-black hover:bg-gray-100">Medium</SelectItem>
                    <SelectItem value="high" className="text-black hover:bg-gray-100">High</SelectItem>
                    <SelectItem value="urgent" className="text-black hover:bg-gray-100">Urgent</SelectItem>
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
                <FormLabel className="text-black">Due Date (Optional)</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal bg-white border-gray-300 text-black",
                          !field.value && "text-gray-500"
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
                  <PopoverContent className="w-auto p-0 bg-white border-gray-300" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))}
                      initialFocus
                      className="bg-white"
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="space-y-2">
          <FormLabel className="text-black">Assign Team Members</FormLabel>
          <Popover open={openMembersDropdown} onOpenChange={setOpenMembersDropdown}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={openMembersDropdown}
                className="w-full justify-between bg-white border-gray-300 text-black"
              >
                <span className="truncate">
                  {selectedMembers.length > 0
                    ? `${selectedMembers.length} member${selectedMembers.length > 1 ? 's' : ''} selected`
                    : "Select team members..."}
                </span>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0 bg-white border-gray-300" align="start">
              <Command className="bg-white">
                <CommandInput placeholder="Search team members..." className="border-0" />
                <CommandList>
                  <CommandEmpty>No team member found.</CommandEmpty>
                  <CommandGroup>
                    {teamMembers?.map((member) => (
                      <CommandItem
                        key={member.id}
                        value={member.name}
                        onSelect={() => handleMemberToggle(member.id)}
                        className="cursor-pointer"
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedMembers.includes(member.id) ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <div className="flex flex-col">
                          <span className="text-black">{member.name}</span>
                          <span className="text-xs text-gray-600">{member.role}</span>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          {selectedMembers.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {selectedMembers.map(memberId => {
                const member = teamMembers?.find(m => m.id === memberId);
                return member ? (
                  <Badge key={memberId} variant="secondary" className="text-xs">
                    {member.name}
                    <button
                      type="button"
                      onClick={() => handleMemberToggle(memberId)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ) : null;
              })}
            </div>
          )}
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
              {addTaskMutation.isPending ? `${submitLabel}...` : submitLabel}
            </Button>
        </div>
      </form>
    </Form>
  );
};