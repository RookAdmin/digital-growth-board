
import { Header } from '@/components/Header';
import { ClientsTable } from '@/components/ClientsTable';

const ClientsPage = () => {
  return (
    <div className="flex flex-col h-screen bg-background">
      <Header />
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="px-6 pt-6 pb-2 flex justify-between items-center flex-shrink-0">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
            <p className="text-muted-foreground">A list of all your converted clients.</p>
          </div>
        </div>
        <div className="p-6 flex-1 overflow-y-auto">
          <ClientsTable />
        </div>
      </main>
    </div>
  );
};

export default ClientsPage;
