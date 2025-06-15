
import { Header } from '@/components/Header';
import { AnalyticsSummary } from '@/components/AnalyticsSummary';
import { LeadConversionChart } from '@/components/LeadConversionChart';
import { ProjectStatusChart } from '@/components/ProjectStatusChart';
import { RevenueChart } from '@/components/RevenueChart';

const ReportingPage = () => {
  return (
    <div className="flex flex-col h-screen bg-background">
      <Header isAuthenticated={true} />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Reporting & Analytics</h1>
          <p className="text-muted-foreground">An overview of your business performance.</p>
        </div>
        <AnalyticsSummary />
        <div className="grid gap-6 mt-6 md:grid-cols-1 lg:grid-cols-2">
          <LeadConversionChart />
          <ProjectStatusChart />
        </div>
        <div className="mt-6">
          <RevenueChart />
        </div>
      </main>
    </div>
  );
};

export default ReportingPage;
