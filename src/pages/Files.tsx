
import { useEffect } from "react";
import { Header } from '@/components/Header';
import { FileUploadPortal } from '@/components/FileUploadPortal';

const FilesPage = () => {
  useEffect(() => {
    document.title = "Files - Rook";
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <Header isAuthenticated={true} />
      
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-black">Files</h1>
          <p className="text-sm sm:text-base lg:text-lg text-gray-600 mt-1 font-light">Manage and organize your project files.</p>
        </div>
        
        <FileUploadPortal clientId="admin" clientName="Admin" />
      </main>
    </div>
  );
};

export default FilesPage;
