
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Tables } from '@/integrations/supabase/types';

type Partner = Tables<'partners'>;
type Project = Tables<'projects'>;

interface AssignPartnerDialogProps {
  partner: Partner;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const AssignPartnerDialog = ({
  partner,
  isOpen,
  onOpenChange,
  onSuccess,
}: AssignPartnerDialogProps) => {
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [assignedRole, setAssignedRole] = useState('');
  const [notes, setNotes] = useState('');
  const queryClient = useQueryClient();

  const { data: projects = [] } = useQuery({
    queryKey: ['available-projects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          id,
          name,
          status,
          clients:client_id (
            name,
            business_name
          )
        `)
        .neq('status', 'Completed')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: isOpen,
  });

  const assignPartnerMutation = useMutation({
    mutationFn: async () => {
      if (!selectedProjectId) {
        throw new Error('Please select a project');
      }

      // Check if assignment already exists
      const { data: existingAssignment } = await supabase
        .from('partner_project_assignments')
        .select('id')
        .eq('partner_id', partner.id)
        .eq('project_id', selectedProjectId)
        .single();

      if (existingAssignment) {
        throw new Error('This partner is already assigned to this project');
      }

      // Get current team member for assigned_by
      const { data: currentTeamMember } = await supabase
        .from('team_members')
        .select('id')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      const { error } = await supabase
        .from('partner_project_assignments')
        .insert({
          partner_id: partner.id,
          project_id: selectedProjectId,
          assigned_role: assignedRole || null,
          notes: notes || null,
          assigned_by: currentTeamMember?.id || null,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partners'] });
      toast.success(`Successfully assigned ${partner.full_name} to the project`);
      onSuccess();
      setSelectedProjectId('');
      setAssignedRole('');
      setNotes('');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    assignPartnerMutation.mutate();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white">
        <DialogHeader>
          <DialogTitle>Assign Project to {partner.full_name}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Select Project
            </label>
            <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a project..." />
              </SelectTrigger>
              <SelectContent className="bg-white">
                {projects.map((project: any) => (
                  <SelectItem key={project.id} value={project.id}>
                    <div>
                      <div className="font-medium">{project.name}</div>
                      <div className="text-xs text-gray-500">
                        Client: {project.clients?.name || 'Unknown'}
                        {project.clients?.business_name && ` (${project.clients.business_name})`}
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Assigned Role (Optional)
            </label>
            <Select value={assignedRole} onValueChange={setAssignedRole}>
              <SelectTrigger>
                <SelectValue placeholder="Select role..." />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="Developer">Developer</SelectItem>
                <SelectItem value="Designer">Designer</SelectItem>
                <SelectItem value="Content Writer">Content Writer</SelectItem>
                <SelectItem value="Marketer">Marketer</SelectItem>
                <SelectItem value="SEO Specialist">SEO Specialist</SelectItem>
                <SelectItem value="Social Media Manager">Social Media Manager</SelectItem>
                <SelectItem value="Consultant">Consultant</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Notes (Optional)
            </label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any special instructions or notes for the partner..."
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={assignPartnerMutation.isPending || !selectedProjectId}
              className="flex-1"
            >
              {assignPartnerMutation.isPending ? 'Assigning...' : 'Assign Project'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
