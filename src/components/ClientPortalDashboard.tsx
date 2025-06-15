
import { ClientPortalHeader } from './ClientPortalHeader';
import { ClientOnboardingProgress } from './ClientOnboardingProgress';
import { ClientProjectsList } from './ClientProjectsList';
import { ClientInvoicesList } from './ClientInvoicesList';
import { ClientFilesList } from './ClientFilesList';

export const ClientPortalDashboard = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <ClientPortalHeader />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Welcome to your client portal. Here you can track your projects, view invoices, and access shared files.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <ClientOnboardingProgress />
            <ClientProjectsList />
          </div>
          
          <div className="space-y-6">
            <ClientInvoicesList />
            <ClientFilesList />
          </div>
        </div>
      </main>
    </div>
  );
};
