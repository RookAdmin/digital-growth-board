import { useEffect, useState } from 'react';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useUnifiedAuth } from '@/hooks/useUnifiedAuth';
import { CreateWorkspaceDialog } from './CreateWorkspaceDialog';
import { JoinWorkspaceDialog } from './JoinWorkspaceDialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Building2, LogIn } from 'lucide-react';

interface WorkspaceSetupGuardProps {
  children: React.ReactNode;
}

export const WorkspaceSetupGuard = ({ children }: WorkspaceSetupGuardProps) => {
  const { user, loading: authLoading } = useUnifiedAuth();
  const { workspaces, isLoading, currentWorkspace } = useWorkspace();
  const [showSetupDialog, setShowSetupDialog] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);

  useEffect(() => {
    // Only show setup dialog if user is logged in, has no workspaces, and not loading
    if (!authLoading && user && !isLoading && workspaces.length === 0) {
      setShowSetupDialog(true);
    } else if (workspaces.length > 0 || !user) {
      setShowSetupDialog(false);
    }
  }, [authLoading, user, isLoading, workspaces.length]);

  // Don't show anything if auth is still loading
  if (authLoading) {
    return <>{children}</>;
  }

  // Only show setup dialog if user is logged in and has no workspaces
  if (user && !isLoading && workspaces.length === 0) {
    return (
      <>
        <Dialog open={showSetupDialog} onOpenChange={setShowSetupDialog}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Welcome! Let's get you started
              </DialogTitle>
              <DialogDescription>
                Create a workspace or join an existing one to continue.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <Button
                onClick={() => {
                  setShowSetupDialog(false);
                  setCreateDialogOpen(true);
                }}
                className="w-full"
                size="lg"
              >
                <Building2 className="h-4 w-4 mr-2" />
                Create New Workspace
              </Button>
              <Button
                onClick={() => {
                  setShowSetupDialog(false);
                  setJoinDialogOpen(true);
                }}
                variant="outline"
                className="w-full"
                size="lg"
              >
                <LogIn className="h-4 w-4 mr-2" />
                Join Workspace
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        <CreateWorkspaceDialog
          isOpen={createDialogOpen}
          onOpenChange={(open) => {
            setCreateDialogOpen(open);
            if (!open && workspaces.length > 0) {
              setShowSetupDialog(false);
            }
          }}
        />
        <JoinWorkspaceDialog
          isOpen={joinDialogOpen}
          onOpenChange={(open) => {
            setJoinDialogOpen(open);
            if (!open && workspaces.length > 0) {
              setShowSetupDialog(false);
            }
          }}
        />
      </>
    );
  }

  return <>{children}</>;
};

