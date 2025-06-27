
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
    <div className="flex flex-col h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <Header />
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="px-4 sm:px-6 pt-4 sm:pt-6 pb-2 flex justify-between items-start sm:items-center flex-shrink-0">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Clients</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">A list of all your converted clients.</p>
          </div>
        </div>
        <div className="p-4 sm:p-6 flex-1 overflow-y-auto">
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
