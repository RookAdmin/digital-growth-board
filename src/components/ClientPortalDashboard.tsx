
import { ClientPortalHeader } from './ClientPortalHeader';
import { ClientOnboardingProgress } from './ClientOnboardingProgress';
import { ClientProjectsList } from './ClientProjectsList';
import { ClientInvoicesList } from './ClientInvoicesList';
import { ClientFilesList } from './ClientFilesList';

export const ClientPortalDashboard = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <ClientPortalHeader />
      
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2 text-sm sm:text-base lg:text-lg font-light">
            Welcome to your client portal. Here you can track your projects, view invoices, and access shared files.
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 sm:gap-8">
          <div className="space-y-6 sm:space-y-8">
            <div className="modern-card overflow-hidden">
              <ClientOnboardingProgress />
            </div>
            <div className="modern-card overflow-hidden">
              <ClientProjectsList />
            </div>
          </div>
          
          <div className="space-y-6 sm:space-y-8">
            <div className="modern-card overflow-hidden">
              <ClientInvoicesList />
            </div>
            <div className="modern-card overflow-hidden">
              <ClientFilesList />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
