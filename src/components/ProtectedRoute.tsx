
import { Navigate, useLocation } from 'react-router-dom';
import { useUnifiedAuth } from '@/hooks/useUnifiedAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, userType, loading } = useUnifiedAuth();
  const location = useLocation();

  // Fetch user role only if user is admin
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
    staleTime: 30 * 60 * 1000, // Cache for 30 minutes
    gcTime: 60 * 60 * 1000, // Keep in cache for 1 hour
  });

  if (loading || (userType === 'admin' && roleLoading)) {
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

  // Check role-based access control
  if (userRole) {
    const allowedPaths = ['/projects'];
    const isProjectDetailPath = location.pathname.startsWith('/projects/');
    
    // Developer: Only projects and project details
    if (userRole === 'Developer') {
      const restrictedPaths = ['/clients', '/dashboard', '/team', '/reporting', '/files', '/scheduling', '/partners'];
      if (restrictedPaths.some(path => location.pathname.startsWith(path))) {
        return <Navigate to="/projects" replace />;
      }
      if (!allowedPaths.includes(location.pathname) && !isProjectDetailPath) {
        return <Navigate to="/projects" replace />;
      }
    }
    
    // Project Manager: Projects and clients (assigned only)
    if (userRole === 'Project Manager') {
      const restrictedPaths = ['/dashboard', '/team', '/reporting', '/files', '/scheduling', '/partners'];
      if (restrictedPaths.some(path => location.pathname.startsWith(path))) {
        return <Navigate to="/projects" replace />;
      }
    }
    
    // SME: Projects and clients (specialization only)
    if (userRole === 'SME (Subject Matter Expert)') {
      const restrictedPaths = ['/dashboard', '/team', '/reporting', '/files', '/scheduling', '/partners'];
      if (restrictedPaths.some(path => location.pathname.startsWith(path))) {
        return <Navigate to="/projects" replace />;
      }
    }
    
    // Client Executive: Access to clients and projects, no admin pages
    if (userRole === 'Client Executive') {
      const restrictedPaths = ['/team', '/reporting', '/partners'];
      if (restrictedPaths.some(path => location.pathname.startsWith(path))) {
        return <Navigate to="/dashboard" replace />;
      }
    }
    
    // CEO and CTO: Full access (no restrictions)
  }

  return <>{children}</>;
};

export default ProtectedRoute;
