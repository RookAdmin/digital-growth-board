
import { useClientAuth } from '@/hooks/useClientAuth';
import { Navigate } from 'react-router-dom';
import { ClientPortalDashboard } from '@/components/ClientPortalDashboard';

const ClientPortalPage = () => {
  const { clientUser, loading } = useClientAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl">Loading...</div>
      </div>
    );
  }

  if (!clientUser) {
    return <Navigate to="/login" replace />;
  }

  return <ClientPortalDashboard />;
};

export default ClientPortalPage;
