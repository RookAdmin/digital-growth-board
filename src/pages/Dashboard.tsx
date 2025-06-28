
import { useEffect } from "react";
import { Header } from "@/components/Header";
import { KanbanBoard } from "@/components/KanbanBoard";

const DashboardPage = () => {
  useEffect(() => {
    document.title = "Dashboard - Rook";
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <Header isAuthenticated={true} />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-black">Dashboard</h1>
          <p className="text-sm sm:text-base lg:text-lg text-gray-600 mt-1 font-light">Manage your leads and track progress.</p>
        </div>
        
        <KanbanBoard />
      </main>
    </div>
  );
};

export default DashboardPage;
