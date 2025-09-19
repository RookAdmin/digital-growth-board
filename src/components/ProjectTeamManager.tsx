import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Users, Plus, X } from 'lucide-react';
import { toast } from 'sonner';

interface ProjectTeamManagerProps {
  projectId: string;
  assignedTeamMembers: string[];
}

export const ProjectTeamManager = ({ projectId, assignedTeamMembers }: ProjectTeamManagerProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState<string[]>(assignedTeamMembers);
  const queryClient = useQueryClient();

  // Fetch all team members
  const { data: allTeamMembers, isLoading } = useQuery({
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

  // Fetch current project team members
  const { data: currentTeamMembers } = useQuery({
    queryKey: ['project-team-members', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('team_members')
        .select('id, name, email, role')
        .in('id', assignedTeamMembers);
      
      if (error) throw error;
      return data || [];
    },
    enabled: assignedTeamMembers.length > 0,
  });

  // Update project team members
  const updateTeamMutation = useMutation({
    mutationFn: async (memberIds: string[]) => {
      const { data, error } = await supabase
        .from('projects')
        .update({ assigned_team_members: memberIds })
        .eq('id', projectId)
        .select()
        .single();
      
      if (error) throw error;

      // Log activity
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('activity_logs').insert({
          project_id: projectId,
          activity_type: 'team_updated',
          user_name: user.user_metadata?.full_name || user.email || 'Unknown User',
          user_email: user.email || '',
          description: `Project team updated`,
          metadata: { team_member_count: memberIds.length }
        });
      }

      return data;
    },
    onSuccess: () => {
      toast.success('Team members updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['activity-logs'] });
      setIsDialogOpen(false);
    },
    onError: (error) => {
      toast.error('Failed to update team members.');
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

  const handleSaveTeam = () => {
    updateTeamMutation.mutate(selectedMembers);
  };

  const handleRemoveMember = (memberId: string) => {
    const updatedMembers = assignedTeamMembers.filter(id => id !== memberId);
    updateTeamMutation.mutate(updatedMembers);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Team Members
            <Badge variant="secondary">{assignedTeamMembers.length}</Badge>
          </CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={() => setSelectedMembers(assignedTeamMembers)}>
                <Plus className="w-4 h-4 mr-2" />
                Manage Team
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Manage Project Team</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {isLoading ? (
                  <div className="text-center py-4">Loading team members...</div>
                ) : (
                  <div className="max-h-60 overflow-y-auto space-y-2">
                    {allTeamMembers?.map((member) => (
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
                )}
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSaveTeam}
                    disabled={updateTeamMutation.isPending}
                  >
                    {updateTeamMutation.isPending ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {currentTeamMembers && currentTeamMembers.length > 0 ? (
          <div className="space-y-3">
            {currentTeamMembers.map((member) => (
              <div key={member.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium">
                      {member.name?.charAt(0) || member.email?.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{member.name}</div>
                    <div className="text-xs text-muted-foreground">{member.role}</div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveMember(member.id)}
                  className="h-8 w-8 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <Users className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No team members assigned</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};