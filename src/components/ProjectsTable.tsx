import { useState, useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DollarSign, Users, Eye, CheckSquare, Trash2, Pencil, Calendar as CalendarIcon, FolderOpen } from 'lucide-react';
import { Project, ProjectStatus } from '@/types';
import { ProjectDetailsModal } from './ProjectDetailsModal';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
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
  searchTerm?: string;
  startDate?: Date;
  endDate?: Date;
  singleDate?: Date;
  statusFilter?: string;
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

const MobileProjectCard = ({ project, onView, onEdit, onDelete }: {
  project: Project;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) => (
  <div className="modern-card p-4 mb-4">
    <div className="flex justify-between items-start mb-3">
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-gray-900 text-sm truncate">{project.name}</h3>
        <p className="text-xs text-gray-500 mt-1">
          {project.clients?.business_name || project.clients?.name}
        </p>
      </div>
      <Badge className={`${getStatusColor(project.status)} text-xs font-medium px-2 py-1 rounded-full ml-2`} variant="outline">
        {project.status}
      </Badge>
    </div>

    {project.description && (
      <p className="text-xs text-gray-600 mb-3 line-clamp-2">{project.description}</p>
    )}

    <div className="grid grid-cols-2 gap-3 mb-4 text-xs">
      <div className="flex items-center gap-1 text-gray-600">
        <CheckSquare className="h-3 w-3" />
        <span>
          {project.tasks ? `${project.tasks.filter((t) => t.status === 'Completed').length}/${project.tasks.length}` : '0'} tasks
        </span>
      </div>
      
      <div className="flex items-center gap-1 text-gray-600">
        <Users className="h-3 w-3" />
        <span>{project.assigned_team_members?.length || 0} members</span>
      </div>

      {project.deadline && (
        <div className="flex items-center gap-1 text-gray-600">
          <CalendarIcon className="h-3 w-3" />
          <span>{format(new Date(project.deadline), 'MMM dd')}</span>
        </div>
      )}

      {project.budget && (
        <div className="flex items-center gap-1 text-gray-900 font-medium">
          <DollarSign className="h-3 w-3" />
          <span>${project.budget.toLocaleString()}</span>
        </div>
      )}
    </div>

    <div className="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={onView}
        className="flex-1 h-8 text-xs modern-button border-gray-200 hover:bg-gray-50"
      >
        <Eye className="mr-1 h-3 w-3" />
        View
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={onEdit}
        className="h-8 px-2 modern-button border-gray-200 hover:bg-gray-50"
      >
        <Pencil className="h-3 w-3" />
      </Button>
      <Button
        variant="destructive"
        size="sm"
        onClick={onDelete}
        className="h-8 px-2 modern-button"
      >
        <Trash2 className="h-3 w-3" />
      </Button>
    </div>
  </div>
);

export const ProjectsTable = ({ projects, searchTerm = '', startDate, endDate, singleDate, statusFilter = '' }: ProjectsTableProps) => {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);
  const [editedProject, setEditedProject] = useState<Partial<Pick<Project, 'status' | 'deadline' | 'budget' | 'name' | 'description'>>>({});

  const filteredProjects = useMemo(() => {
    return projects.filter(project => {
      // Search filter
      const term = searchTerm.toLowerCase();
      const matchesSearch = !term || (
        project.name.toLowerCase().includes(term) ||
        (project.description && project.description.toLowerCase().includes(term)) ||
        (project.clients?.name && project.clients.name.toLowerCase().includes(term)) ||
        (project.clients?.business_name && project.clients.business_name.toLowerCase().includes(term)) ||
        project.status.toLowerCase().includes(term)
      );

      // Status filter
      const matchesStatus = !statusFilter || project.status === statusFilter;

      // Single date filter (creation date)
      const matchesDate = !singleDate || 
        new Date(project.created_at).toDateString() === singleDate.toDateString();

      // Date range filter
      let matchesDateRange = true;
      if (startDate || endDate) {
        const createdDate = new Date(project.created_at);
        if (startDate) {
          matchesDateRange = matchesDateRange && createdDate >= startDate;
        }
        if (endDate) {
          const endOfDay = new Date(endDate);
          endOfDay.setHours(23, 59, 59, 999);
          matchesDateRange = matchesDateRange && createdDate <= endOfDay;
        }
      }

      return matchesSearch && matchesStatus && matchesDate && matchesDateRange;
    });
  }, [projects, searchTerm, startDate, endDate, singleDate, statusFilter]);

  const queryClient = useQueryClient();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  const handleViewProject = (project: Project) => {
    navigate(`/projects/${project.id}`);
  };

  const handleCloseModal = () => {
    setShowDetailsModal(false);
    setSelectedProject(null);
  };

  const deleteProjectMutation = useMutation({
    mutationFn: async (projectId: string) => {
      console.log('Deleting project:', projectId);
      const { error } = await supabase.from('projects').delete().eq('id', projectId);
      if (error) {
        console.error('Delete project error:', error);
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
      console.error('Delete project mutation error:', error);
      toast({
        title: "Error",
        description: `Failed to delete project: ${error.message}`,
        variant: "destructive",
      });
      setProjectToDelete(null);
    },
  });

  const editProjectMutation = useMutation({
    mutationFn: async (projectData: { 
      status: ProjectStatus; 
      deadline: string | null; 
      budget: number | null; 
      name: string;
      description: string | null;
      id: string 
    }) => {
      const { id, ...updateData } = projectData;
      console.log('Updating project:', id, updateData);
      
      const { data, error } = await supabase
        .from('projects')
        .update({
          name: updateData.name,
          description: updateData.description,
          status: updateData.status,
          deadline: updateData.deadline,
          budget: updateData.budget,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Update project error:', error);
        throw error;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('activity_logs').insert({
          project_id: id,
          activity_type: 'project_updated',
          user_name: user.user_metadata?.full_name || user.email || 'Unknown User',
          user_email: user.email || '',
          description: `Project updated: ${updateData.name}, status ${updateData.status}${updateData.budget ? `, budget $${updateData.budget.toLocaleString()}` : ''}`,
          metadata: {
            old_status: projects.find(p => p.id === id)?.status,
            new_status: updateData.status,
            deadline: updateData.deadline,
            budget: updateData.budget,
            name: updateData.name,
            description: updateData.description
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
      console.error('Edit project mutation error:', error);
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
    if (projectToEdit && editedProject.status && editedProject.name) {
      editProjectMutation.mutate({ 
        id: projectToEdit.id, 
        name: editedProject.name,
        description: editedProject.description || null,
        status: editedProject.status, 
        deadline: editedProject.deadline || null,
        budget: editedProject.budget || null
      });
    }
  };

  const openEditModal = (project: Project) => {
    setProjectToEdit(project);
    setEditedProject({
      name: project.name,
      description: project.description,
      status: project.status,
      deadline: project.deadline,
      budget: project.budget,
    });
  };

  if (projects.length === 0) {
    return (
      <div className="p-8 text-center bg-white">
        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
          <FolderOpen className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No projects yet</h3>
        <p className="text-gray-500">Create your first project to get started with managing client work.</p>
      </div>
    );
  }

  if (filteredProjects.length === 0 && (searchTerm || startDate || endDate || singleDate || statusFilter)) {
    return (
      <div className="p-8 text-center bg-white">
        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
          <FolderOpen className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No projects found</h3>
        <p className="text-gray-500">No projects match your current filters. Try adjusting your search criteria.</p>
      </div>
    );
  }

  if (isMobile) {
    return (
      <>
        <div className="space-y-0">
          <div className="modern-card mb-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold text-gray-900">
                Active Projects ({projects.length})
              </CardTitle>
            </CardHeader>
          </div>
          
          <div className="space-y-0">
            {filteredProjects.map((project) => (
              <MobileProjectCard
                key={project.id}
                project={project}
                onView={() => handleViewProject(project)}
                onEdit={() => openEditModal(project)}
                onDelete={() => setProjectToDelete(project)}
              />
            ))}
          </div>
        </div>

        <ProjectDetailsModal
          project={selectedProject}
          isOpen={showDetailsModal}
          onClose={handleCloseModal}
        />

        {projectToDelete && (
          <AlertDialog open={!!projectToDelete} onOpenChange={(open) => !open && setProjectToDelete(null)}>
            <AlertDialogContent className="modern-card mx-4">
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Project</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the project
                  "{projectToDelete.name}" and all of its associated data.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setProjectToDelete(null)} className="modern-button">Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteProject}
                  disabled={deleteProjectMutation.isPending}
                  className="bg-red-600 hover:bg-red-700 modern-button"
                >
                  {deleteProjectMutation.isPending ? 'Deleting...' : 'Delete'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}

        {projectToEdit && (
          <Dialog open={!!projectToEdit} onOpenChange={(open) => !open && setProjectToEdit(null)}>
            <DialogContent className="sm:max-w-[600px] modern-card mx-4 max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Project Details</DialogTitle>
                <DialogDescription>
                  Update all project information including name, description, status, deadline, and budget.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleEditProject} className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="project-name">Project Name</Label>
                  <Input
                    id="project-name"
                    value={editedProject.name || ''}
                    onChange={(e) => setEditedProject({ ...editedProject, name: e.target.value })}
                    placeholder="Enter project name"
                    required
                    className="modern-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="project-description">Description</Label>
                  <Input
                    id="project-description"
                    value={editedProject.description || ''}
                    onChange={(e) => setEditedProject({ ...editedProject, description: e.target.value })}
                    placeholder="Enter project description"
                    className="modern-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={editedProject.status}
                    onValueChange={(value) => setEditedProject({ ...editedProject, status: value as ProjectStatus })}
                  >
                    <SelectTrigger className="modern-input">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent className="modern-card">
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
                          "w-full justify-start text-left font-normal modern-input",
                          !editedProject.deadline && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {editedProject.deadline ? format(new Date(editedProject.deadline), "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 modern-card">
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
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="budget"
                      type="number"
                      placeholder="0.00"
                      value={editedProject.budget || ''}
                      onChange={(e) => setEditedProject({ ...editedProject, budget: e.target.value ? parseFloat(e.target.value) : null })}
                      className="pl-10 modern-input"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <p className="text-xs text-gray-500">Enter the project budget in US dollars</p>
                </div>
                
                <DialogFooter className="gap-2">
                  <DialogClose asChild>
                    <Button type="button" variant="outline" onClick={() => setProjectToEdit(null)} className="modern-button flex-1 sm:flex-none">
                      Cancel
                    </Button>
                  </DialogClose>
                  <Button type="submit" disabled={editProjectMutation.isPending} className="modern-button bg-green-600 hover:bg-green-700 flex-1 sm:flex-none">
                    {editProjectMutation.isPending ? 'Saving...' : 'Save Changes'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </>
    );
  }

  return (
    <>
      <div className="modern-card">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-semibold text-gray-900">
            Active Projects ({filteredProjects.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-auto max-h-[calc(100vh-300px)]">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-gray-200/50">
                  <TableHead className="w-[250px] font-medium text-gray-700">Project</TableHead>
                  <TableHead className="w-[200px] font-medium text-gray-700">Client</TableHead>
                  <TableHead className="w-[120px] font-medium text-gray-700">Status</TableHead>
                  <TableHead className="w-[80px] font-medium text-gray-700">Tasks</TableHead>
                  <TableHead className="w-[120px] font-medium text-gray-700">Deadline</TableHead>
                  <TableHead className="w-[100px] font-medium text-gray-700">Team</TableHead>
                  <TableHead className="w-[120px] font-medium text-gray-700">Budget</TableHead>
                  <TableHead className="w-[100px] font-medium text-gray-700">Created</TableHead>
                  <TableHead className="w-[200px] font-medium text-gray-700">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProjects.map((project, index) => (
                  <TableRow 
                    key={project.id} 
                    className={`border-0 hover:bg-gray-50 transition-colors cursor-pointer ${
                      index < filteredProjects.length - 1 ? 'border-b border-gray-100' : ''
                    }`}
                  >
                    <TableCell className="py-4">
                      <div className="space-y-1">
                        <div className="font-medium text-sm leading-tight text-gray-900">{project.name}</div>
                        {project.description && (
                          <div className="text-xs text-gray-500 line-clamp-2 max-w-[230px]">
                            {project.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="space-y-1">
                        <div className="font-medium text-sm text-gray-900">
                          {project.clients?.business_name || project.clients?.name}
                        </div>
                        <div className="text-xs text-gray-500">{project.clients?.email}</div>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <Badge className={`${getStatusColor(project.status)} text-xs font-medium px-3 py-1 rounded-full`} variant="outline">
                        {project.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-4">
                      {project.tasks && project.tasks.length > 0 ? (
                        <div className="flex items-center gap-1 text-xs text-gray-600">
                          <CheckSquare className="h-3 w-3" />
                          <span>
                            {project.tasks.filter((t) => t.status === 'Completed').length}/{project.tasks.length}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">None</span>
                      )}
                    </TableCell>
                    <TableCell className="py-4">
                      {project.deadline ? (
                        <div className="flex items-center gap-1 text-xs text-gray-600">
                          <CalendarIcon className="h-3 w-3" />
                          <span>{format(new Date(project.deadline), 'MMM dd, yyyy')}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">Not set</span>
                      )}
                    </TableCell>
                    <TableCell className="py-4">
                      {project.assigned_team_members && project.assigned_team_members.length > 0 ? (
                        <div className="flex items-center gap-1 text-xs text-gray-600">
                          <Users className="h-3 w-3" />
                          <span>{project.assigned_team_members.length}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">None</span>
                      )}
                    </TableCell>
                    <TableCell className="py-4">
                      {project.budget ? (
                        <div className="flex items-center gap-1 text-xs font-medium text-gray-900">
                          <DollarSign className="h-3 w-3" />
                          <span>${project.budget.toLocaleString()}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">Not set</span>
                      )}
                    </TableCell>
                    <TableCell className="py-4">
                      <span className="text-xs text-gray-500">
                        {format(new Date(project.created_at), 'MMM dd, yyyy')}
                      </span>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewProject(project)}
                          className="h-8 px-3 text-xs modern-button border-gray-200 hover:bg-gray-50"
                        >
                          <Eye className="mr-1 h-3 w-3" />
                          View
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditModal(project)}
                          className="h-8 w-8 p-0 modern-button border-gray-200 hover:bg-gray-50"
                        >
                          <Pencil className="h-3 w-3" />
                          <span className="sr-only">Edit project</span>
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setProjectToDelete(project)}
                          className="h-8 w-8 p-0 modern-button"
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
      </div>

      <ProjectDetailsModal
        project={selectedProject}
        isOpen={showDetailsModal}
        onClose={handleCloseModal}
      />

      {projectToDelete && (
        <AlertDialog open={!!projectToDelete} onOpenChange={(open) => !open && setProjectToDelete(null)}>
          <AlertDialogContent className="modern-card">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Project</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the project
                "{projectToDelete.name}" and all of its associated data.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setProjectToDelete(null)} className="modern-button">Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteProject}
                disabled={deleteProjectMutation.isPending}
                className="bg-red-600 hover:bg-red-700 modern-button"
              >
                {deleteProjectMutation.isPending ? 'Deleting...' : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {projectToEdit && (
        <Dialog open={!!projectToEdit} onOpenChange={(open) => !open && setProjectToEdit(null)}>
          <DialogContent className="sm:max-w-[600px] modern-card">
            <DialogHeader>
              <DialogTitle>Edit Project Details</DialogTitle>
              <DialogDescription>
                Update all project information including name, description, status, deadline, and budget.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEditProject} className="space-y-6 py-4">
              <div className="space-y-2">
                <Label htmlFor="project-name">Project Name</Label>
                <Input
                  id="project-name"
                  value={editedProject.name || ''}
                  onChange={(e) => setEditedProject({ ...editedProject, name: e.target.value })}
                  placeholder="Enter project name"
                  required
                  className="modern-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="project-description">Description</Label>
                <Input
                  id="project-description"
                  value={editedProject.description || ''}
                  onChange={(e) => setEditedProject({ ...editedProject, description: e.target.value })}
                  placeholder="Enter project description"
                  className="modern-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={editedProject.status}
                  onValueChange={(value) => setEditedProject({ ...editedProject, status: value as ProjectStatus })}
                >
                  <SelectTrigger className="modern-input">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent className="modern-card">
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
                        "w-full justify-start text-left font-normal modern-input",
                        !editedProject.deadline && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {editedProject.deadline ? format(new Date(editedProject.deadline), "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 modern-card">
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
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="budget"
                    type="number"
                    placeholder="0.00"
                    value={editedProject.budget || ''}
                    onChange={(e) => setEditedProject({ ...editedProject, budget: e.target.value ? parseFloat(e.target.value) : null })}
                    className="pl-10 modern-input"
                    min="0"
                    step="0.01"
                  />
                </div>
                <p className="text-xs text-gray-500">Enter the project budget in US dollars</p>
              </div>
              
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline" onClick={() => setProjectToEdit(null)} className="modern-button">
                    Cancel
                  </Button>
                </DialogClose>
                <Button type="submit" disabled={editProjectMutation.isPending} className="modern-button bg-green-600 hover:bg-green-700">
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
