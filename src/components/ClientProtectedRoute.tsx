
import { Navigate, useLocation } from 'react-router-dom';
import { useClientAuth } from '@/hooks/useClientAuth';

interface ClientProtectedRouteProps {
  children: React.ReactNode;
}

const ClientProtectedRoute = ({ children }: ClientProtectedRouteProps) => {
  const { clientUser, loading } = useClientAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-2xl">Loading...</div>
      </div>
    );
  }

  if (!clientUser) {
    return <Navigate to="/login" replace />;
  }

  // If password hasn't been changed and not already on change password page, redirect
  if (!clientUser.password_changed && location.pathname !== '/client/change-password') {
    return <Navigate to="/client/change-password" replace />;
  }

  // If password has been changed and on change password page, redirect to portal
  if (clientUser.password_changed && location.pathname === '/client/change-password') {
    return <Navigate to="/client-portal" replace />;
  }

  return <>{children}</>;
};

export default ClientProtectedRoute;
