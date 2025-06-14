
import { KanbanBoard } from '@/components/KanbanBoard';
import { Header } from '@/components/Header';

const DashboardPage = () => {
  return (
    <div className="flex flex-col h-screen bg-background">
      <Header isAuthenticated={true} />
      <main className="flex-1 flex flex-col overflow-hidden">
          <div className="px-6 pt-6 pb-2">
            <h1 className="text-3xl font-bold tracking-tight">Leads Dashboard</h1>
            <p className="text-muted-foreground">Drag and drop to manage your sales pipeline.</p>
          </div>
          <KanbanBoard />
      </main>
    </div>
  );
};

export default DashboardPage;
