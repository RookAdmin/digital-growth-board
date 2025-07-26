
import { Navigate } from 'react-router-dom';
import { usePartnerAuth } from '@/hooks/usePartnerAuth';

interface PartnerProtectedRouteProps {
  children: React.ReactNode;
}

const PartnerProtectedRoute = ({ children }: PartnerProtectedRouteProps) => {
  const { partner, loading } = usePartnerAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-2xl">Loading...</div>
      </div>
    );
  }

  if (!partner) {
    return <Navigate to="/partner/login" replace />;
  }

  return <>{children}</>;
};

export default PartnerProtectedRoute;
