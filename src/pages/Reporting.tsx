
import { Header } from '@/components/Header';
import { AnalyticsSummary } from '@/components/AnalyticsSummary';
import { LeadConversionChart } from '@/components/LeadConversionChart';
import { ProjectStatusChart } from '@/components/ProjectStatusChart';
import { RevenueChart } from '@/components/RevenueChart';

const ReportingPage = () => {
  return (
    <div className="min-h-screen bg-white">
      <Header isAuthenticated={true} />
      
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-black">Reporting & Analytics</h1>
          <p className="text-sm sm:text-base lg:text-lg text-gray-600 mt-1 font-light">An overview of your business performance.</p>
        </div>
        
        <div className="space-y-6 sm:space-y-8">
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden p-6">
            <AnalyticsSummary />
          </div>
          
          <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden p-6">
              <LeadConversionChart />
            </div>
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden p-6">
              <ProjectStatusChart />
            </div>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden p-6">
            <RevenueChart />
          </div>
        </div>
      </main>
    </div>
  );
};

export default ReportingPage;
