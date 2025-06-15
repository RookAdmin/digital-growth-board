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
      return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    case 'In Progress':
      return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
    case 'Review':
      return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
    case 'Completed':
      return 'bg-green-100 text-green-800 hover:bg-green-200';
    default:
      return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
  }
};

const getStatusIcon = (status: ProjectStatus) => {
  switch (status) {
    case 'Not Started':
      return '⏸️';
    case 'In Progress':
      return '🚀';
    case 'Review':
      return '👀';
    case 'Completed':
      return '✅';
    default:
      return '⏸️';
  }
};

export const ProjectsTable = ({ projects }: ProjectsTableProps) => {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);
  const [editedProject, setEditedProject] = useState<Partial<Pick<Project, 'status' | 'deadline'>>>({});

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
    mutationFn: async (projectData: { status: ProjectStatus; deadline: string | null; id: string }) => {
      const { id, ...updateData } = projectData;
      const { data, error } = await supabase
        .from('projects')
        .update({
          status: updateData.status,
          deadline: updateData.deadline,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
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
      editProjectMutation.mutate({ id: projectToEdit.id, status: editedProject.status, deadline: editedProject.deadline || null });
    }
  };

  const openEditModal = (project: Project) => {
    setProjectToEdit(project);
    setEditedProject({
      status: project.status,
      deadline: project.deadline,
    });
  };

  if (projects.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <p className="text-lg text-muted-foreground">No projects found</p>
            <p className="text-sm text-muted-foreground mt-2">Try adjusting your filters or search terms.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>Active Projects ({projects.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto max-h-[600px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tasks</TableHead>
                  <TableHead>Deadline</TableHead>
                  <TableHead>Team</TableHead>
                  <TableHead>Budget</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.map((project) => (
                  <TableRow key={project.id} className="hover:bg-muted/50 animate-fade-in">
                    <TableCell>
                      <div>
                        <div className="font-medium">{project.name}</div>
                        {project.description && (
                          <div className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {project.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{project.clients?.business_name || project.clients?.name}</div>
                        <div className="text-sm text-muted-foreground">{project.clients?.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(project.status)} variant="secondary">
                        <span className="mr-1">{getStatusIcon(project.status)}</span>
                        {project.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {project.tasks && project.tasks.length > 0 ? (
                        <div className="flex items-center gap-1 text-sm">
                          <CheckSquare className="h-4 w-4" />
                          <span>
                            {project.tasks.filter((t) => t.status === 'Completed').length} / {project.tasks.length}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">No tasks</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {project.deadline ? (
                        <div className="flex items-center gap-1 text-sm">
                          <CalendarIcon className="h-4 w-4" />
                          {format(new Date(project.deadline), 'MMM dd, yyyy')}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">No deadline</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {project.assigned_team_members && project.assigned_team_members.length > 0 ? (
                        <div className="flex items-center gap-1 text-sm">
                          <Users className="h-4 w-4" />
                          <span>{project.assigned_team_members.length} member{project.assigned_team_members.length !== 1 ? 's' : ''}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {project.budget ? (
                        <div className="flex items-center gap-1 text-sm">
                          <DollarSign className="h-4 w-4" />
                          ${project.budget.toLocaleString()}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">No budget</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(project.created_at), 'MMM dd, yyyy')}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewProject(project)}
                          className="hover-scale"
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View Tasks
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => openEditModal(project)}
                          className="hover-scale h-9 w-9"
                        >
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">Edit project</span>
                        </Button>
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => setProjectToDelete(project)}
                          className="hover-scale h-9 w-9"
                        >
                          <Trash2 className="h-4 w-4" />
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
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
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
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Project: {projectToEdit.name}</DialogTitle>
              <DialogDescription>Update the project's status and deadline.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEditProject} className="space-y-4 py-4">
              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={editedProject.status}
                  onValueChange={(value) => setEditedProject({ ...editedProject, status: value as ProjectStatus })}
                >
                  <SelectTrigger className="mt-1">
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
              <div>
                <Label>Deadline</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal mt-1",
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
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="ghost" onClick={() => setProjectToEdit(null)}>Cancel</Button>
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
