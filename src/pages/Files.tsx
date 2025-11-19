
import { useEffect } from "react";
import { Header } from '@/components/Header';
import { FileUploadPortal } from '@/components/FileUploadPortal';
import { DockNav } from '@/components/DockNav';
import { PageHero } from '@/components/PageHero';

const FilesPage = () => {
  useEffect(() => {
    document.title = "Files - Rook";
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f7f4ef] via-[#f4f1ff] to-[#eef7ff] pb-32">
      <Header isAuthenticated={true} />
      
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6">
        <PageHero
          title="Files"
          description="Manage and organize every asset, approval, and delivery with a touch of calm."
        />
        
        <section className="rounded-[32px] border border-white/80 bg-white shadow-[0_25px_90px_rgba(15,23,42,0.08)] p-6 animate-in fade-in duration-500">
          <FileUploadPortal clientId="admin" clientName="Admin" />
        </section>
      </main>
      <DockNav />
    </div>
  );
};

export default FilesPage;
