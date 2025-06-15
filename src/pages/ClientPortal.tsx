
import { useClientAuth } from '@/hooks/useClientAuth';
import { ClientPortalLogin } from '@/components/ClientPortalLogin';
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
    return <ClientPortalLogin />;
  }

  return <ClientPortalDashboard />;
};

export default ClientPortalPage;
