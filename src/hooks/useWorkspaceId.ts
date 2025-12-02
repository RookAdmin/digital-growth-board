import { useParams } from 'react-router-dom';
import { useWorkspace } from '@/contexts/WorkspaceContext';

export const useWorkspaceId = () => {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { currentWorkspace } = useWorkspace();
  
  // Return workspace ID from URL, or fallback to current workspace
  return workspaceId || currentWorkspace?.id || null;
};

