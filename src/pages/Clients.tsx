
import { Header } from '@/components/Header';
import { ClientsTable } from '@/components/ClientsTable';
import { useSearchParams } from 'react-router-dom';
import { OnboardingModal } from '@/components/OnboardingModal';

const ClientsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const onboardingClientId = searchParams.get('onboarding');

  const handleCloseModal = () => {
    searchParams.delete('onboarding');
    setSearchParams(searchParams);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-gray-900">Clients</h1>
          <p className="text-sm sm:text-base lg:text-lg text-gray-600 mt-1 font-light">A list of all your converted clients.</p>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <ClientsTable />
        </div>
      </main>
      
      {onboardingClientId && (
        <OnboardingModal
          clientId={onboardingClientId}
          isOpen={!!onboardingClientId}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
};

export default ClientsPage;
