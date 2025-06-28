
import { Navigate } from 'react-router-dom';
import { useClientAuth } from '@/hooks/useClientAuth';

interface ClientProtectedRouteProps {
  children: React.ReactNode;
}

const ClientProtectedRoute = ({ children }: ClientProtectedRouteProps) => {
  const { clientUser, loading } = useClientAuth();

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

  return <>{children}</>;
};

export default ClientProtectedRoute;
