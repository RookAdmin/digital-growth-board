
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

  // Fetch user role
  const { data: userRole, isLoading: roleLoading } = useQuery({
    queryKey: ['userRole', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from('team_members')
        .select('role')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();
      return data?.role || null;
    },
    enabled: !!user && userType === 'admin',
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

  // Check if Developer role is trying to access non-project pages
  if (userRole === 'Developer') {
    const allowedPaths = ['/projects'];
    const isProjectDetailPath = location.pathname.startsWith('/projects/');
    
    if (!allowedPaths.includes(location.pathname) && !isProjectDetailPath) {
      return <Navigate to="/projects" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
