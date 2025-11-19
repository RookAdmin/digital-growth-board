
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useClientAuth } from '@/hooks/useClientAuth';
import { Calendar, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { Project } from '@/types';
import { pillClasses } from '@/constants/palette';

export const ClientProjectsList = () => {
  const { clientUser } = useClientAuth();

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['client-projects', clientUser?.client_id],
    queryFn: async () => {
      if (!clientUser?.client_id) return [];
      
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('client_id', clientUser.client_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Project[];
    },
    enabled: !!clientUser?.client_id,
  });

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

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>My Projects</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Projects</CardTitle>
      </CardHeader>
      <CardContent>
        {projects.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No projects found. Your projects will appear here once they're created.
          </p>
        ) : (
          <div className="space-y-4">
            {projects.map((project) => (
              <div key={project.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold">{project.name}</h3>
                  <Badge className={getStatusColor(project.status)} variant="secondary">
                    {project.status}
                  </Badge>
                </div>
                
                {project.description && (
                  <p className="text-sm text-muted-foreground mb-3">
                    {project.description}
                  </p>
                )}
                
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  {project.deadline && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>Due: {format(new Date(project.deadline), 'MMM dd, yyyy')}</span>
                    </div>
                  )}
                  {project.budget && (
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4" />
                      <span>${project.budget.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
