
import { Header } from '@/components/Header';
import { AnalyticsSummary } from '@/components/AnalyticsSummary';
import { LeadConversionChart } from '@/components/LeadConversionChart';
import { ProjectStatusChart } from '@/components/ProjectStatusChart';
import { RevenueChart } from '@/components/RevenueChart';

const ReportingPage = () => {
  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <Header isAuthenticated={true} />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Reporting & Analytics</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">An overview of your business performance.</p>
        </div>
        <AnalyticsSummary />
        <div className="grid gap-4 sm:gap-6 mt-4 sm:mt-6 grid-cols-1 lg:grid-cols-2">
          <LeadConversionChart />
          <ProjectStatusChart />
        </div>
        <div className="mt-4 sm:mt-6">
          <RevenueChart />
        </div>
      </main>
    </div>
  );
};

export default ReportingPage;
