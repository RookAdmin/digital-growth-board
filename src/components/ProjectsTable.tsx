
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar, DollarSign, Users, Eye } from 'lucide-react';
import { Project, ProjectStatus } from '@/types';
import { ProjectDetailsModal } from './ProjectDetailsModal';
import { format } from 'date-fns';

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

  const handleViewProject = (project: Project) => {
    setSelectedProject(project);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProject(null);
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
                      {project.deadline ? (
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-4 w-4" />
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
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewProject(project)}
                        className="hover-scale"
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        View Tasks
                      </Button>
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
    </>
  );
};
