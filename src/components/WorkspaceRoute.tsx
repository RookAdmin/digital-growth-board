import { useParams, Navigate } from 'react-router-dom';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useEffect } from 'react';

interface WorkspaceRouteProps {
  children: React.ReactNode;
}

export const WorkspaceRoute = ({ children }: WorkspaceRouteProps) => {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { currentWorkspace, workspaces, isLoading } = useWorkspace();

  useEffect(() => {
    if (workspaceId && currentWorkspace?.id && currentWorkspace.id !== workspaceId) {
      // Update localStorage if workspace ID in URL is different
      const workspace = workspaces.find(w => w.id === workspaceId);
      if (workspace) {
        localStorage.setItem('currentWorkspaceId', workspaceId);
        window.location.reload();
      }
    }
  }, [workspaceId, currentWorkspace, workspaces]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-2xl">Loading workspace...</div>
      </div>
    );
  }

  // If no workspace ID in URL, redirect to default workspace
  if (!workspaceId && currentWorkspace?.id) {
    return <Navigate to={`${window.location.pathname}/${currentWorkspace.id}`} replace />;
  }

  // If workspace ID doesn't match any workspace, redirect to first workspace
  if (workspaceId && !workspaces.find(w => w.id === workspaceId)) {
    if (currentWorkspace?.id) {
      return <Navigate to={`${window.location.pathname.replace(/\/[^/]+$/, '')}/${currentWorkspace.id}`} replace />;
    }
  }

  return <>{children}</>;
};

