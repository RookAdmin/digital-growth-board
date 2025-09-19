
import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Tables } from "@/integrations/supabase/types";
import { InviteMemberDialog } from './InviteMemberDialog';
import { EditTeamMemberDialog } from './EditTeamMemberDialog';
import { Plus, Edit, UserX, UserCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';

type TeamMember = Tables<'team_members'>;

interface TeamMembersTableProps {
  teamMembers: TeamMember[];
  onRefresh?: () => void;
}

export const TeamMembersTable = ({ teamMembers, onRefresh }: TeamMembersTableProps) => {
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const queryClient = useQueryClient();

  const toggleMemberStatusMutation = useMutation({
    mutationFn: async ({ memberId, isActive }: { memberId: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('team_members')
        .update({ is_active: !isActive })
        .eq('id', memberId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
      toast.success('Team member status updated successfully');
    },
    onError: (error) => {
      toast.error(`Failed to update team member status: ${error.message}`);
    }
  });

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "Admin":
        return "bg-green-100 text-green-800 border-green-200 hover:bg-green-200";
      case "Client Executive":
        return "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200";
      case "Developers":
        return "bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const handleInviteSuccess = () => {
    if (onRefresh) {
      onRefresh();
    }
  };

  const handleEditSuccess = () => {
    setEditingMember(null);
    if (onRefresh) {
      onRefresh();
    }
  };

  const handleToggleStatus = (member: TeamMember) => {
    toggleMemberStatusMutation.mutate({ 
      memberId: member.id, 
      isActive: member.is_active 
    });
  };

  if (!teamMembers || teamMembers.length === 0) {
    return (
      <div className="p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
          <span className="text-2xl text-gray-400">👥</span>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No team members yet</h3>
        <p className="text-gray-500 mb-4">Get started by inviting your first team member.</p>
        <Button onClick={() => setIsInviteDialogOpen(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Team Member
        </Button>
        <InviteMemberDialog
          isOpen={isInviteDialogOpen}
          onOpenChange={setIsInviteDialogOpen}
          onInviteSuccess={handleInviteSuccess}
        />
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl">
      <div className="flex justify-between items-center p-6 bg-white border-b border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900">Team Members</h2>
        <Button onClick={() => setIsInviteDialogOpen(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Team Member
        </Button>
      </div>
      
      <Table>
        <TableHeader>
          <TableRow className="border-0 bg-gray-50/50">
            <TableHead className="font-semibold text-gray-900 py-4 px-6">Name</TableHead>
            <TableHead className="font-semibold text-gray-900 py-4 px-6">Email</TableHead>
            <TableHead className="font-semibold text-gray-900 py-4 px-6">Role</TableHead>
            <TableHead className="font-semibold text-gray-900 py-4 px-6">Status</TableHead>
            <TableHead className="font-semibold text-gray-900 py-4 px-6">Joined At</TableHead>
            <TableHead className="font-semibold text-gray-900 py-4 px-6">Password</TableHead>
            <TableHead className="font-semibold text-gray-900 py-4 px-6">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {teamMembers.map((member, index) => (
            <TableRow 
              key={member.id} 
              className={`border-0 hover:bg-gray-50/30 transition-colors ${
                index < teamMembers.length - 1 ? 'border-b border-gray-100/50' : ''
              }`}
            >
              <TableCell className="font-medium text-gray-900 py-4 px-6">{member.name}</TableCell>
              <TableCell className="text-gray-600 py-4 px-6">{member.email}</TableCell>
              <TableCell className="py-4 px-6">
                <Badge variant="outline" className={getRoleBadge(member.role)}>
                  {member.role}
                </Badge>
              </TableCell>
              <TableCell className="py-4 px-6">
                <Badge 
                  variant="outline" 
                  className={member.is_active ? 
                    "bg-green-100 text-green-800 border-green-200" : 
                    "bg-red-100 text-red-800 border-red-200"
                  }
                >
                  {member.is_active ? "Active" : "Inactive"}
                </Badge>
              </TableCell>
              <TableCell className="text-gray-600 py-4 px-6">
                {member.joined_at ? format(new Date(member.joined_at), "PPP") : "Pending"}
              </TableCell>
              <TableCell className="py-4 px-6">
                <Badge 
                  variant="outline" 
                  className={member.password_changed ? 
                    "bg-green-100 text-green-800 border-green-200" : 
                    "bg-yellow-100 text-yellow-800 border-yellow-200"
                  }
                >
                  {member.password_changed ? "Updated" : "Default"}
                </Badge>
              </TableCell>
              <TableCell className="py-4 px-6">
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setEditingMember(member)}
                    className="flex items-center gap-1"
                  >
                    <Edit className="h-3 w-3" />
                    Edit
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleToggleStatus(member)}
                    disabled={toggleMemberStatusMutation.isPending}
                    className={`flex items-center gap-1 ${
                      member.is_active 
                        ? 'text-red-600 hover:text-red-700 hover:bg-red-50' 
                        : 'text-green-600 hover:text-green-700 hover:bg-green-50'
                    }`}
                  >
                    {member.is_active ? (
                      <>
                        <UserX className="h-3 w-3" />
                        Disable
                      </>
                    ) : (
                      <>
                        <UserCheck className="h-3 w-3" />
                        Enable
                      </>
                    )}
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <InviteMemberDialog
        isOpen={isInviteDialogOpen}
        onOpenChange={setIsInviteDialogOpen}
        onInviteSuccess={handleInviteSuccess}
      />

      {editingMember && (
        <EditTeamMemberDialog
          teamMember={editingMember}
          isOpen={!!editingMember}
          onOpenChange={(open) => !open && setEditingMember(null)}
          onEditSuccess={handleEditSuccess}
        />
      )}
    </div>
  );
};
