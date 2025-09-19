
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Tables } from '@/integrations/supabase/types';

type TeamMember = Tables<'team_members'>;

interface EditTeamMemberDialogProps {
  teamMember: TeamMember;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onEditSuccess: () => void;
}

const roles = ["Admin", "Client Executive", "Developers"];

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
                {roles.map((roleOption) => (
                  <SelectItem key={roleOption} value={roleOption}>
                    {roleOption}
                  </SelectItem>
                ))}
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
