
import { useEffect } from "react";
import { Header } from '@/components/Header';
import { ProjectsTable } from '@/components/ProjectsTable';

const ProjectsPage = () => {
  useEffect(() => {
    document.title = "Projects - Rook";
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <Header isAuthenticated={true} />
      
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-black">Projects</h1>
          <p className="text-sm sm:text-base lg:text-lg text-gray-600 mt-1 font-light">Manage and track all your active projects.</p>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <ProjectsTable />
        </div>
      </main>
    </div>
  );
};

export default ProjectsPage;
