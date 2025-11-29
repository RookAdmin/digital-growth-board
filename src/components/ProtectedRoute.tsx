
import { Navigate, useLocation } from 'react-router-dom';
import { useUnifiedAuth } from '@/hooks/useUnifiedAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useUserPermissions } from '@/hooks/useUserPermissions';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

// Map routes to permission pages
const routeToPermissionPage: Record<string, string> = {
  '/dashboard': 'dashboard',
  '/clients': 'clients',
  '/leads': 'leads',
  '/projects': 'projects',
  '/team': 'team',
  '/billing': 'billing',
  '/scheduling': 'scheduling',
  '/files': 'files',
  '/reporting': 'reporting',
  '/partners': 'partners',
  '/settings': 'settings',
};

const getPermissionPageFromPath = (pathname: string): string | null => {
  // Check exact matches first
  if (routeToPermissionPage[pathname]) {
    return routeToPermissionPage[pathname];
  }
  
  // Check path prefixes (e.g., /projects/123 -> projects)
  for (const [route, page] of Object.entries(routeToPermissionPage)) {
    if (pathname.startsWith(route + '/') || pathname.startsWith(route)) {
      return page;
    }
  }
  
  return null;
};

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, userType, loading } = useUnifiedAuth();
  const location = useLocation();
  const { permissions, isLoading: permissionsLoading, canAccessPage } = useUserPermissions();

  // Fetch user role for fallback checks
  const { data: userRole, isLoading: roleLoading } = useQuery({
    queryKey: ['userRole', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from('team_members')
        .select('role')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();
      return data?.role || null;
    },
    enabled: !!user && userType === 'admin',
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });

  if (loading || (userType === 'admin' && (roleLoading || permissionsLoading))) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-2xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (userType === 'partner') {
    return <Navigate to="/partner/dashboard" replace />;
  }

  // Check permissions-based access control
  if (userType === 'admin' && userRole) {
    const permissionPage = getPermissionPageFromPath(location.pathname);
    
    // If we have a permission page mapping, check permissions
    if (permissionPage) {
      // Super Admin always has access
      if (userRole === 'Super Admin') {
        return <>{children}</>;
      }
      
      // Check if user has read access to this page
      if (!canAccessPage(permissionPage)) {
        // Redirect to first accessible page or dashboard
        const accessiblePages = ['dashboard', 'projects', 'clients', 'leads'];
        for (const page of accessiblePages) {
          if (canAccessPage(page)) {
            const route = Object.entries(routeToPermissionPage).find(([_, p]) => p === page)?.[0];
            if (route) {
              return <Navigate to={route} replace />;
            }
          }
        }
        return <Navigate to="/dashboard" replace />;
      }
    }
    
    // Fallback: If no permission mapping, use legacy role-based checks for backwards compatibility
    // This handles edge cases and ensures existing functionality continues to work
    const allowedPaths = ['/projects'];
    const isProjectDetailPath = location.pathname.startsWith('/projects/');
    
    if (userRole === 'Developer') {
      const restrictedPaths = ['/clients', '/dashboard', '/team', '/reporting', '/files', '/scheduling', '/partners'];
      if (restrictedPaths.some(path => location.pathname.startsWith(path))) {
        return <Navigate to="/projects" replace />;
      }
      if (!allowedPaths.includes(location.pathname) && !isProjectDetailPath) {
        return <Navigate to="/projects" replace />;
      }
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
