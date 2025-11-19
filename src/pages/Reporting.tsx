
import { useEffect } from 'react';
import { Header } from '@/components/Header';
import { AnalyticsSummary } from '@/components/AnalyticsSummary';
import { LeadConversionChart } from '@/components/LeadConversionChart';
import { ProjectStatusChart } from '@/components/ProjectStatusChart';
import { RevenueChart } from '@/components/RevenueChart';
import { DockNav } from '@/components/DockNav';
import { PageHero } from '@/components/PageHero';

const ReportingPage = () => {
  useEffect(() => {
    document.title = "Reporting - Rook";
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f7f4ef] via-[#f4f1ff] to-[#eef7ff] pb-32">
      <Header isAuthenticated={true} />
      
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6">
        <PageHero
          title="Reporting & Analytics"
          description="An uplifting look at revenue, velocity, and delivery health—all in one sightline."
        />
        
        <div className="space-y-6 sm:space-y-8">
          <div className="rounded-[32px] border border-white/80 bg-white p-6 shadow-[0_25px_90px_rgba(15,23,42,0.08)] animate-in fade-in duration-500">
            <AnalyticsSummary />
          </div>
          
          <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
            <div className="rounded-[28px] border border-white/70 bg-white p-6 shadow-[0_20px_70px_rgba(15,23,42,0.08)]">
              <LeadConversionChart />
            </div>
            <div className="rounded-[28px] border border-white/70 bg-white p-6 shadow-[0_20px_70px_rgba(15,23,42,0.08)]">
              <ProjectStatusChart />
            </div>
          </div>
          
          <div className="rounded-[32px] border border-white/70 bg-white p-6 shadow-[0_25px_90px_rgba(15,23,42,0.08)]">
            <RevenueChart />
          </div>
        </div>
      </main>
      <DockNav />
    </div>
  );
};

export default ReportingPage;
