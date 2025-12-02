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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Building2 } from 'lucide-react';

const WORKSPACE_CATEGORIES = [
  'Agency',
  'Freelancer',
  'Startup',
  'Enterprise',
  'Non-profit',
  'Education',
  'Healthcare',
  'E-commerce',
  'Technology',
  'Marketing',
  'Design',
  'Consulting',
  'Other',
];

interface CreateWorkspaceDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CreateWorkspaceDialog = ({ isOpen, onOpenChange }: CreateWorkspaceDialogProps) => {
  const { createWorkspace } = useWorkspace();
  const [name, setName] = useState('');
  const [workspaceType, setWorkspaceType] = useState<'Creator' | 'Business'>('Business');
  const [category, setCategory] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast.error('Workspace name is required');
      return;
    }

    if (!category) {
      toast.error('Workspace category is required');
      return;
    }

    setIsSubmitting(true);
    try {
      await createWorkspace({
        name: name.trim(),
        workspace_type: workspaceType,
        category,
      });
      // Reset form
      setName('');
      setWorkspaceType('Business');
      setCategory('');
      onOpenChange(false);
    } catch (error) {
      // Error is handled in the mutation
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Let's set up your first workspace!
          </DialogTitle>
          <DialogDescription>
            Create a workspace to organize your team, projects, and clients.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="workspace-name">Workspace Name *</Label>
            <Input
              id="workspace-name"
              placeholder="Enter workspace name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="workspace-type">Workspace Type *</Label>
            <Select value={workspaceType} onValueChange={(value: 'Creator' | 'Business') => setWorkspaceType(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Creator or Business?" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Creator">Creator</SelectItem>
                <SelectItem value="Business">Business</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Workspace Category *</Label>
            <Select value={category} onValueChange={setCategory} required>
              <SelectTrigger>
                <SelectValue placeholder="Select your category" />
              </SelectTrigger>
              <SelectContent>
                {WORKSPACE_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
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
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Workspace'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

