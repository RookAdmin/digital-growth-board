import { createContext, useContext, ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUnifiedAuth } from '@/hooks/useUnifiedAuth';
import { toast } from 'sonner';

export interface Workspace {
  id: string;
  name: string;
  workspace_type: 'Creator' | 'Business';
  category: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface WorkspaceMember {
  id: string;
  workspace_id: string;
  user_id: string;
  role: 'Owner' | 'Admin' | 'Member';
  joined_at: string;
}

interface WorkspaceContextType {
  currentWorkspace: Workspace | null;
  workspaces: Workspace[];
  isLoading: boolean;
  switchWorkspace: (workspaceId: string) => void;
  createWorkspace: (data: CreateWorkspaceData) => Promise<void>;
  joinWorkspace: (inviteCode: string) => Promise<void>;
  refreshWorkspaces: () => void;
}

interface CreateWorkspaceData {
  name: string;
  workspace_type: 'Creator' | 'Business';
  category: string;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within WorkspaceProvider');
  }
  return context;
};

export const WorkspaceProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useUnifiedAuth();
  const queryClient = useQueryClient();
  const currentWorkspaceId = localStorage.getItem('currentWorkspaceId');

  // Fetch user's workspaces
  const { data: workspaces = [], isLoading } = useQuery({
    queryKey: ['workspaces', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('workspace_members')
        .select(`
          workspace_id,
          workspaces:workspace_id (
            id,
            name,
            workspace_type,
            category,
            created_by,
            created_at,
            updated_at
          )
        `)
        .eq('user_id', user.id);
      
      if (error) throw error;
      return (data || []).map((item: any) => item.workspaces).filter(Boolean) as Workspace[];
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  });

  // Get current workspace
  const currentWorkspace = workspaces.find(w => w.id === currentWorkspaceId) || workspaces[0] || null;

  // Update current workspace in localStorage when it changes
  if (currentWorkspace?.id && currentWorkspaceId !== currentWorkspace.id) {
    localStorage.setItem('currentWorkspaceId', currentWorkspace.id);
  }

  // Create workspace mutation
  const createWorkspaceMutation = useMutation({
    mutationFn: async (data: CreateWorkspaceData) => {
      // Use RPC function to create workspace (bypasses RLS)
      const { data: workspaceId, error: rpcError } = await supabase.rpc('create_workspace', {
        p_name: data.name,
        p_workspace_type: data.workspace_type,
        p_category: data.category,
      });

      if (rpcError) {
        // Fallback to direct insert if RPC function doesn't exist
        const { data: workspace, error: wsError } = await supabase
          .from('workspaces')
          .insert({
            name: data.name,
            workspace_type: data.workspace_type,
            category: data.category,
            created_by: user!.id,
          })
          .select()
          .single();

        if (wsError) throw wsError;

        // Add creator as Owner
        const { error: memberError } = await supabase
          .from('workspace_members')
          .insert({
            workspace_id: workspace.id,
            user_id: user!.id,
            role: 'Owner',
          });

        if (memberError) throw memberError;

        return workspace;
      }

      // Fetch the created workspace
      const { data: workspace, error: fetchError } = await supabase
        .from('workspaces')
        .select('*')
        .eq('id', workspaceId)
        .single();

      if (fetchError) throw fetchError;

      return workspace;
    },
    onSuccess: (workspace) => {
      queryClient.invalidateQueries({ queryKey: ['workspaces', user?.id] });
      localStorage.setItem('currentWorkspaceId', workspace.id);
      toast.success('Workspace created successfully!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create workspace: ${error.message}`);
    },
  });

  // Join workspace by invite code
  const joinWorkspaceMutation = useMutation({
    mutationFn: async (inviteCode: string) => {
      // Find invite
      const { data: invite, error: inviteError } = await supabase
        .from('workspace_invites')
        .select('*, workspaces:workspace_id (*)')
        .eq('invite_code', inviteCode.toUpperCase())
        .eq('is_active', true)
        .single();

      if (inviteError || !invite) {
        throw new Error('Invalid or expired invite code');
      }

      // Check if invite is expired
      if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
        throw new Error('Invite code has expired');
      }

      // Check if invite has reached max uses
      if (invite.max_uses && invite.uses_count >= invite.max_uses) {
        throw new Error('Invite code has reached maximum uses');
      }

      // Check if user is already a member
      const { data: existingMember } = await supabase
        .from('workspace_members')
        .select('id')
        .eq('workspace_id', invite.workspace_id)
        .eq('user_id', user!.id)
        .single();

      if (existingMember) {
        throw new Error('You are already a member of this workspace');
      }

      // Add user as member
      const { error: memberError } = await supabase
        .from('workspace_members')
        .insert({
          workspace_id: invite.workspace_id,
          user_id: user!.id,
          role: 'Member',
        });

      if (memberError) throw memberError;

      // Update invite uses
      const { error: updateError } = await supabase
        .from('workspace_invites')
        .update({ uses_count: invite.uses_count + 1 })
        .eq('id', invite.id);

      if (updateError) throw updateError;

      return invite.workspace_id;
    },
    onSuccess: (workspaceId) => {
      queryClient.invalidateQueries({ queryKey: ['workspaces', user?.id] });
      localStorage.setItem('currentWorkspaceId', workspaceId);
      toast.success('Successfully joined workspace!');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const switchWorkspace = (workspaceId: string) => {
    localStorage.setItem('currentWorkspaceId', workspaceId);
    queryClient.invalidateQueries();
    window.location.reload(); // Reload to update all queries with new workspace
  };

  const createWorkspace = async (data: CreateWorkspaceData) => {
    await createWorkspaceMutation.mutateAsync(data);
  };

  const joinWorkspace = async (inviteCode: string) => {
    await joinWorkspaceMutation.mutateAsync(inviteCode);
  };

  const refreshWorkspaces = () => {
    queryClient.invalidateQueries({ queryKey: ['workspaces', user?.id] });
  };

  return (
    <WorkspaceContext.Provider
      value={{
        currentWorkspace,
        workspaces,
        isLoading,
        switchWorkspace,
        createWorkspace,
        joinWorkspace,
        refreshWorkspaces,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
};

