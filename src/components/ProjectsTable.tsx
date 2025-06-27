
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DollarSign, Users, Eye, CheckSquare, Trash2, Pencil, Calendar as CalendarIcon } from 'lucide-react';
import { Project, ProjectStatus } from '@/types';
import { ProjectDetailsModal } from './ProjectDetailsModal';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from '@/lib/utils';

interface ProjectsTableProps {
  projects: Project[];
}

const getStatusColor = (status: ProjectStatus) => {
  switch (status) {
    case 'Not Started':
      return 'bg-slate-100 text-slate-700 border-slate-200';
    case 'In Progress':
      return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'Review':
      return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'Completed':
      return 'bg-green-100 text-green-700 border-green-200';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
};

export const ProjectsTable = ({ projects }: ProjectsTableProps) => {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);
  const [editedProject, setEditedProject] = useState<Partial<Pick<Project, 'status' | 'deadline' | 'budget'>>>({});

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleViewProject = (project: Project) => {
    setSelectedProject(project);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProject(null);
  };

  const deleteProjectMutation = useMutation({
    mutationFn: async (projectId: string) => {
      const { error } = await supabase.from('projects').delete().eq('id', projectId);
      if (error) {
        throw new Error(error.message);
      }
    },
    onSuccess: () => {
      toast({
        title: "Project Deleted",
        description: "The project and all its associated data have been deleted.",
      });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setProjectToDelete(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete project: ${error.message}`,
        variant: "destructive",
      });
      setProjectToDelete(null);
    },
  });

  const editProjectMutation = useMutation({
    mutationFn: async (projectData: { status: ProjectStatus; deadline: string | null; budget: number | null; id: string }) => {
      const { id, ...updateData } = projectData;
      const { data, error } = await supabase
        .from('projects')
        .update({
          status: updateData.status,
          deadline: updateData.deadline,
          budget: updateData.budget,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Log activity for project update
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('activity_logs').insert({
          project_id: id,
          activity_type: 'project_updated',
          user_name: user.user_metadata?.full_name || user.email || 'Unknown User',
          user_email: user.email || '',
          description: `Project updated: status ${updateData.status}${updateData.budget ? `, budget $${updateData.budget}` : ''}`,
          metadata: {
            old_status: projects.find(p => p.id === id)?.status,
            new_status: updateData.status,
            deadline: updateData.deadline,
            budget: updateData.budget
          }
        });
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['activity-logs'] });
      toast({
        title: "Project Updated",
        description: "The project details have been updated successfully.",
      });
      setProjectToEdit(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update project: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleDeleteProject = () => {
    if (projectToDelete) {
      deleteProjectMutation.mutate(projectToDelete.id);
    }
  };

  const handleEditProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (projectToEdit && editedProject.status) {
      editProjectMutation.mutate({ 
        id: projectToEdit.id, 
        status: editedProject.status, 
        deadline: editedProject.deadline || null,
        budget: editedProject.budget || null
      });
    }
  };

  const openEditModal = (project: Project) => {
    setProjectToEdit(project);
    setEditedProject({
      status: project.status,
      deadline: project.deadline,
      budget: project.budget,
    });
  };

  if (projects.length === 0) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="flex items-center justify-center py-16">
          <div className="text-center">
            <p className="text-xl text-muted-foreground mb-2">No projects found</p>
            <p className="text-sm text-muted-foreground">Try adjusting your filters or search terms</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-semibold">
            Active Projects ({projects.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-auto max-h-[calc(100vh-300px)]">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-border/50">
                  <TableHead className="w-[250px] font-medium">Project</TableHead>
                  <TableHead className="w-[200px] font-medium">Client</TableHead>
                  <TableHead className="w-[120px] font-medium">Status</TableHead>
                  <TableHead className="w-[80px] font-medium">Tasks</TableHead>
                  <TableHead className="w-[120px] font-medium">Deadline</TableHead>
                  <TableHead className="w-[100px] font-medium">Team</TableHead>
                  <TableHead className="w-[120px] font-medium">Budget</TableHead>
                  <TableHead className="w-[100px] font-medium">Created</TableHead>
                  <TableHead className="w-[200px] font-medium">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.map((project) => (
                  <TableRow key={project.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="py-4">
                      <div className="space-y-1">
                        <div className="font-medium text-sm leading-tight">{project.name}</div>
                        {project.description && (
                          <div className="text-xs text-muted-foreground line-clamp-2 max-w-[230px]">
                            {project.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="space-y-1">
                        <div className="font-medium text-sm">
                          {project.clients?.business_name || project.clients?.name}
                        </div>
                        <div className="text-xs text-muted-foreground">{project.clients?.email}</div>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <Badge className={`${getStatusColor(project.status)} text-xs font-medium px-2 py-1`} variant="outline">
                        {project.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-4">
                      {project.tasks && project.tasks.length > 0 ? (
                        <div className="flex items-center gap-1 text-xs">
                          <CheckSquare className="h-3 w-3" />
                          <span>
                            {project.tasks.filter((t) => t.status === 'Completed').length}/{project.tasks.length}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-xs">None</span>
                      )}
                    </TableCell>
                    <TableCell className="py-4">
                      {project.deadline ? (
                        <div className="flex items-center gap-1 text-xs">
                          <CalendarIcon className="h-3 w-3" />
                          <span>{format(new Date(project.deadline), 'MMM dd, yyyy')}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-xs">Not set</span>
                      )}
                    </TableCell>
                    <TableCell className="py-4">
                      {project.assigned_team_members && project.assigned_team_members.length > 0 ? (
                        <div className="flex items-center gap-1 text-xs">
                          <Users className="h-3 w-3" />
                          <span>{project.assigned_team_members.length}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-xs">None</span>
                      )}
                    </TableCell>
                    <TableCell className="py-4">
                      {project.budget ? (
                        <div className="flex items-center gap-1 text-xs font-medium">
                          <DollarSign className="h-3 w-3" />
                          <span>{project.budget.toLocaleString()}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-xs">Not set</span>
                      )}
                    </TableCell>
                    <TableCell className="py-4">
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(project.created_at), 'MMM dd, yyyy')}
                      </span>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewProject(project)}
                          className="h-8 px-3 text-xs"
                        >
                          <Eye className="mr-1 h-3 w-3" />
                          View
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditModal(project)}
                          className="h-8 w-8 p-0"
                        >
                          <Pencil className="h-3 w-3" />
                          <span className="sr-only">Edit project</span>
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setProjectToDelete(project)}
                          className="h-8 w-8 p-0"
                        >
                          <Trash2 className="h-3 w-3" />
                          <span className="sr-only">Delete project</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <ProjectDetailsModal
        project={selectedProject}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />

      {projectToDelete && (
        <AlertDialog open={!!projectToDelete} onOpenChange={(open) => !open && setProjectToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Project</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the project
                "{projectToDelete.name}" and all of its associated data.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setProjectToDelete(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteProject}
                disabled={deleteProjectMutation.isPending}
                className="bg-destructive hover:bg-destructive/90"
              >
                {deleteProjectMutation.isPending ? 'Deleting...' : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {projectToEdit && (
        <Dialog open={!!projectToEdit} onOpenChange={(open) => !open && setProjectToEdit(null)}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Edit Project</DialogTitle>
              <DialogDescription>
                Update the project status, deadline, and budget for "{projectToEdit.name}".
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEditProject} className="space-y-6 py-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={editedProject.status}
                  onValueChange={(value) => setEditedProject({ ...editedProject, status: value as ProjectStatus })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Not Started">Not Started</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Review">Review</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Deadline</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !editedProject.deadline && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {editedProject.deadline ? format(new Date(editedProject.deadline), "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={editedProject.deadline ? new Date(editedProject.deadline) : undefined}
                      onSelect={(date) => setEditedProject({ ...editedProject, deadline: date ? date.toISOString().split('T')[0] : null })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="budget">Budget (USD)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="budget"
                    type="number"
                    placeholder="Enter budget amount"
                    value={editedProject.budget || ''}
                    onChange={(e) => setEditedProject({ ...editedProject, budget: e.target.value ? parseFloat(e.target.value) : null })}
                    className="pl-10"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
              
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline" onClick={() => setProjectToEdit(null)}>
                    Cancel
                  </Button>
                </DialogClose>
                <Button type="submit" disabled={editProjectMutation.isPending}>
                  {editProjectMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};
