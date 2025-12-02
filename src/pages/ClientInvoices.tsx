import { useEffect } from 'react';
import ClientProtectedRoute from '@/components/ClientProtectedRoute';
import { ClientPortalHeader } from '@/components/ClientPortalHeader';
import { ClientInvoicesList } from '@/components/ClientInvoicesList';
import { ClientDock } from '@/components/ClientDock';
import { Card, CardContent } from '@/components/ui/card';

const ClientInvoices = () => {
  useEffect(() => {
    document.title = "My Invoices - Rook";
  }, []);

  return (
    <ClientProtectedRoute>
      <div className="min-h-screen bg-gray-50 pb-32">
        <ClientPortalHeader />
        
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">My Invoices</h1>
            <p className="text-gray-600 mt-2 text-sm sm:text-base lg:text-lg font-light">
              View and download all your invoices.
            </p>
          </div>

          <Card className="border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <CardContent className="p-0">
              <ClientInvoicesList />
            </CardContent>
          </Card>
        </main>
        <ClientDock />
      </div>
    </ClientProtectedRoute>
  );
};

export default ClientInvoices;

