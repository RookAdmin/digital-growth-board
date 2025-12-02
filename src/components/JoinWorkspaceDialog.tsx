import { useState } from 'react';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { LogIn } from 'lucide-react';

interface JoinWorkspaceDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export const JoinWorkspaceDialog = ({ isOpen, onOpenChange }: JoinWorkspaceDialogProps) => {
  const { joinWorkspace } = useWorkspace();
  const [inviteCode, setInviteCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inviteCode.trim()) {
      toast.error('Invite code is required');
      return;
    }

    setIsSubmitting(true);
    try {
      await joinWorkspace(inviteCode.trim().toUpperCase());
      setInviteCode('');
      onOpenChange(false);
    } catch (error) {
      // Error is handled in the mutation
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LogIn className="h-5 w-5" />
            Join Workspace
          </DialogTitle>
          <DialogDescription>
            Enter the 10-character invite code to join a workspace.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="invite-code">Invite Code *</Label>
            <Input
              id="invite-code"
              placeholder="Enter 10-character code"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              maxLength={10}
              required
              className="font-mono text-center text-lg tracking-widest"
            />
            <p className="text-xs text-gray-500">
              Enter the 10-character alphanumeric invite code
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || inviteCode.length !== 10}>
              {isSubmitting ? 'Joining...' : 'Join Workspace'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

