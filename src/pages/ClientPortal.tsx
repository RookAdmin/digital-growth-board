
import { useEffect } from "react";
import { ClientProtectedRoute } from '@/components/ClientProtectedRoute';
import { ClientPortalDashboard } from '@/components/ClientPortalDashboard';

const ClientPortalPage = () => {
  useEffect(() => {
    document.title = "Client Portal - Rook";
  }, []);

  return (
    <ClientProtectedRoute>
      <ClientPortalDashboard />
    </ClientProtectedRoute>
  );
};

export default ClientPortalPage;
