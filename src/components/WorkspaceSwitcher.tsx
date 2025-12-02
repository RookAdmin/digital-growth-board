import { useState } from 'react';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Building2, ChevronDown, Plus, LogOut } from 'lucide-react';
import { CreateWorkspaceDialog } from './CreateWorkspaceDialog';
import { JoinWorkspaceDialog } from './JoinWorkspaceDialog';
import { useNavigate } from 'react-router-dom';

export const WorkspaceSwitcher = () => {
  const { currentWorkspace, workspaces, switchWorkspace } = useWorkspace();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const navigate = useNavigate();

  const handleSwitch = (workspaceId: string) => {
    switchWorkspace(workspaceId);
    // Navigate to dashboard with new workspace ID
    navigate(`/dashboard/${workspaceId}`);
  };

  if (!currentWorkspace) {
    return (
      <>
        <Button
          onClick={() => setCreateDialogOpen(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Create Workspace
        </Button>
        <CreateWorkspaceDialog
          isOpen={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
        />
      </>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="flex items-center gap-2 min-w-[200px] justify-between"
          >
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              <span className="truncate">{currentWorkspace.name}</span>
            </div>
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuLabel>Switch Workspace</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {workspaces.map((workspace) => (
            <DropdownMenuItem
              key={workspace.id}
              onClick={() => handleSwitch(workspace.id)}
              className={workspace.id === currentWorkspace.id ? 'bg-gray-100' : ''}
            >
              <Building2 className="h-4 w-4 mr-2" />
              <span className="truncate">{workspace.name}</span>
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Workspace
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setJoinDialogOpen(true)}>
            <LogOut className="h-4 w-4 mr-2" />
            Join Workspace
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <CreateWorkspaceDialog
        isOpen={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
      <JoinWorkspaceDialog
        isOpen={joinDialogOpen}
        onOpenChange={setJoinDialogOpen}
      />
    </>
  );
};

