
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Project } from '@/types';
import { TaskTracker } from './TaskTracker';
import { format } from 'date-fns';
import { Calendar, DollarSign, Users } from 'lucide-react';

interface ProjectDetailsModalProps {
  project: Project | null;
  isOpen: boolean;
  onClose: () => void;
}

const getStatusColor = (status: string) => {
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

export const ProjectDetailsModal = ({ project, isOpen, onClose }: ProjectDetailsModalProps) => {
  if (!project) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto animate-scale-in">
        <DialogHeader>
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <DialogTitle className="text-2xl font-bold">{project.name}</DialogTitle>
                <p className="text-muted-foreground mt-1">
                  {project.clients?.business_name || project.clients?.name}
                </p>
              </div>
              <Badge className={getStatusColor(project.status)} variant="secondary">
                {project.status}
              </Badge>
            </div>
            
            {project.description && (
              <p className="text-sm text-muted-foreground">{project.description}</p>
            )}
            
            <div className="flex flex-wrap gap-4 text-sm">
              {project.deadline && (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Due: {format(new Date(project.deadline), 'MMM dd, yyyy')}</span>
                </div>
              )}
              {project.budget && (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <DollarSign className="h-4 w-4" />
                  <span>Budget: ${project.budget.toLocaleString()}</span>
                </div>
              )}
              {project.assigned_team_members && project.assigned_team_members.length > 0 && (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>{project.assigned_team_members.length} team member{project.assigned_team_members.length !== 1 ? 's' : ''}</span>
                </div>
              )}
            </div>
          </div>
        </DialogHeader>
        
        <div className="mt-6">
          <TaskTracker projectId={project.id} />
        </div>
      </DialogContent>
    </Dialog>
  );
};
