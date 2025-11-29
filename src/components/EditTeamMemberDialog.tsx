
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Tables } from '@/integrations/supabase/types';
import { Role } from '@/types/permissions';

type TeamMember = Tables<'team_members'>;

interface EditTeamMemberDialogProps {
  teamMember: TeamMember;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onEditSuccess: () => void;
}

export const EditTeamMemberDialog = ({ 
  teamMember, 
  isOpen, 
  onOpenChange, 
  onEditSuccess 
}: EditTeamMemberDialogProps) => {
  const [name, setName] = useState(teamMember.name);
  const [email, setEmail] = useState(teamMember.email);
  const [role, setRole] = useState(teamMember.role);
  const queryClient = useQueryClient();

  // Fetch assignable roles from database
  const { data: roles = [], isLoading: rolesLoading } = useQuery({
    queryKey: ['assignable-roles'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_roles', { include_non_assignable: false });
      if (error) throw error;
      return (data || []) as Role[];
    },
  });

  const updateMemberMutation = useMutation({
    mutationFn: async (data: { name: string; email: string; role: string }) => {
      const { error } = await supabase
        .from('team_members')
        .update({
          name: data.name,
          email: data.email,
          role: data.role,
        })
        .eq('id', teamMember.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
      toast.success('Team member updated successfully');
      onEditSuccess();
    },
    onError: (error) => {
      toast.error(`Failed to update team member: ${error.message}`);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !email.trim() || !role) {
      toast.error('Please fill in all required fields');
      return;
    }

    updateMemberMutation.mutate({ name: name.trim(), email: email.trim(), role });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Team Member</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter full name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email address"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role *</Label>
            <Select value={role} onValueChange={setRole} required>
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {rolesLoading ? (
                  <SelectItem value="loading" disabled>Loading roles...</SelectItem>
                ) : roles.length === 0 ? (
                  <SelectItem value="no-roles" disabled>No roles available</SelectItem>
                ) : (
                  roles
                    .filter(roleOption => roleOption.is_assignable && roleOption.name !== 'Super Admin')
                    .map((roleOption) => (
                      <SelectItem key={roleOption.id} value={roleOption.name}>
                        {roleOption.name}
                      </SelectItem>
                    ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={updateMemberMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updateMemberMutation.isPending}
            >
              {updateMemberMutation.isPending ? 'Updating...' : 'Update Member'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
