
import { Navigate, Outlet } from 'react-router-dom';
import { useClientAuth } from '@/hooks/useClientAuth';

const ClientProtectedRoute = () => {
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

  return <Outlet />;
};

export default ClientProtectedRoute;
