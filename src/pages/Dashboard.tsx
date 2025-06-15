
import { KanbanBoard } from '@/components/KanbanBoard';
import { Header } from '@/components/Header';
import { AddLeadDialog } from '@/components/AddLeadDialog';
import { useState } from 'react';
import { Input } from '@/components/ui/input';

const DashboardPage = () => {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="flex flex-col h-screen bg-background">
      <Header isAuthenticated={true} />
      <main className="flex-1 flex flex-col overflow-hidden">
          <div className="px-6 pt-6 pb-2 flex justify-between items-center flex-shrink-0">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Leads Dashboard</h1>
              <p className="text-muted-foreground">Drag and drop to manage your sales pipeline.</p>
            </div>
            <div className="flex items-center gap-4">
              <Input
                placeholder="Search by name, email, phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
              <AddLeadDialog />
            </div>
          </div>
          <KanbanBoard searchTerm={searchTerm} />
      </main>
    </div>
  );
};

export default DashboardPage;
