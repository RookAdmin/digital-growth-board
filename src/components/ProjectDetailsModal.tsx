
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Project } from '@/types';
import { TaskTracker } from './TaskTracker';
import { ProjectFileManager } from './ProjectFileManager';
import { ProjectMessaging } from './ProjectMessaging';
import { ProjectActivityLog } from './ProjectActivityLog';
import { format } from 'date-fns';
import { Calendar, DollarSign, Users, CheckSquare, Upload, MessageSquare, Activity } from 'lucide-react';
import { pillClasses } from '@/constants/palette';

interface ProjectDetailsModalProps {
  project: Project | null;
  isOpen: boolean;
  onClose: () => void;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Not Started':
      return pillClasses.light;
    case 'In Progress':
      return pillClasses.dark;
    case 'Review':
      return pillClasses.charcoal;
    case 'Completed':
      return pillClasses.soft;
    default:
      return pillClasses.light;
  }
};

export const ProjectDetailsModal = ({ project, isOpen, onClose }: ProjectDetailsModalProps) => {
  if (!project) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto animate-scale-in bg-white border-gray-200 shadow-lg">
        <DialogHeader className="bg-white border-b border-gray-100 pb-4">
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <DialogTitle className="text-2xl font-bold text-gray-900">{project.name}</DialogTitle>
                <p className="text-gray-600 mt-1">
                  {project.clients?.business_name || project.clients?.name}
                </p>
              </div>
              <Badge className={getStatusColor(project.status)} variant="secondary">
                {project.status}
              </Badge>
            </div>
            
            {project.description && (
              <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">{project.description}</p>
            )}
            
            <div className="flex flex-wrap gap-4 text-sm">
              {project.deadline && (
                <div className="flex items-center gap-1 text-gray-700 bg-gray-50 px-3 py-2 rounded-lg">
                  <Calendar className="h-4 w-4 text-gray-600" />
                  <span>Due: {format(new Date(project.deadline), 'MMM dd, yyyy')}</span>
                </div>
              )}
              {project.budget && (
                <div className="flex items-center gap-1 text-gray-700 bg-gray-50 px-3 py-2 rounded-lg">
                  <DollarSign className="h-4 w-4 text-gray-600" />
                  <span>Budget: ${project.budget.toLocaleString()}</span>
                </div>
              )}
              {project.assigned_team_members && project.assigned_team_members.length > 0 && (
                <div className="flex items-center gap-1 text-gray-700 bg-gray-50 px-3 py-2 rounded-lg">
                  <Users className="h-4 w-4 text-gray-600" />
                  <span>{project.assigned_team_members.length} team member{project.assigned_team_members.length !== 1 ? 's' : ''}</span>
                </div>
              )}
            </div>
          </div>
        </DialogHeader>
        
        <div className="mt-6 bg-white">
          <Tabs defaultValue="tasks" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4 bg-gray-50 border border-gray-200">
              <TabsTrigger value="tasks" className="flex items-center gap-2 text-gray-700 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm">
                <CheckSquare className="h-4 w-4" />
                Tasks
              </TabsTrigger>
              <TabsTrigger value="files" className="flex items-center gap-2 text-gray-700 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm">
                <Upload className="h-4 w-4" />
                Files
              </TabsTrigger>
              <TabsTrigger value="messages" className="flex items-center gap-2 text-gray-700 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm">
                <MessageSquare className="h-4 w-4" />
                Messages
              </TabsTrigger>
              <TabsTrigger value="activity" className="flex items-center gap-2 text-gray-700 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm">
                <Activity className="h-4 w-4" />
                Activity
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="tasks" className="space-y-4 bg-white">
              <TaskTracker projectId={project.id} />
            </TabsContent>
            
            <TabsContent value="files" className="space-y-4 bg-white">
              <ProjectFileManager 
                projectId={project.id} 
                projectName={project.name}
              />
            </TabsContent>
            
            <TabsContent value="messages" className="space-y-4 bg-white">
              <div className="bg-white">
                <h3 className="text-lg font-semibold mb-4 text-gray-900">Project Chat</h3>
                <ProjectMessaging projectId={project.id} />
              </div>
            </TabsContent>
            
            <TabsContent value="activity" className="space-y-4 bg-white">
              <div className="bg-white">
                <h3 className="text-lg font-semibold mb-4 text-gray-900">Activity Log</h3>
                <ProjectActivityLog projectId={project.id} />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};
