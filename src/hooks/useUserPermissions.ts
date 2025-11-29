import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { RolePermissions, hasPermission, canAccessPage } from '@/types/permissions';

export const useUserPermissions = () => {
  const { data: permissions, isLoading } = useQuery({
    queryKey: ['userPermissions'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_user_permissions');
      if (error) throw error;
      return (data || {}) as RolePermissions;
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });

  return {
    permissions: permissions || {},
    isLoading,
    hasPermission: (page: string, action: 'read' | 'write' | 'delete' | 'admin') =>
      permissions ? hasPermission(permissions, page, action) : false,
    canAccessPage: (page: string) => permissions ? canAccessPage(permissions, page) : false,
  };
};

