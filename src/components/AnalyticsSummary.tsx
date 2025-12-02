
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Briefcase, DollarSign, FileClock, CheckCircle } from 'lucide-react';
import { useWorkspaceId } from '@/hooks/useWorkspaceId';

const fetchAnalyticsSummary = async (workspaceId: string | null) => {
  if (!workspaceId) return { leadCount: 0, clientCount: 0, totalRevenue: 0, activeProjectsCount: 0, pendingInvoicesCount: 0 };
  
  const { count: leadCount, error: leadError } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true })
    .eq('workspace_id', workspaceId);
  if (leadError) throw new Error(leadError.message);

  const { count: clientCount, error: clientError } = await supabase
    .from('clients')
    .select('*', { count: 'exact', head: true })
    .eq('workspace_id', workspaceId);
  if (clientError) throw new Error(clientError.message);
  
  const { data: paidInvoices, error: invoiceError } = await supabase
    .from('invoices')
    .select('total_amount, projects!inner(workspace_id)')
    .eq('status', 'Paid')
    .eq('projects.workspace_id', workspaceId);
  if (invoiceError) throw new Error(invoiceError.message);
  const totalRevenue = paidInvoices?.reduce((sum, inv) => sum + (inv.total_amount || 0), 0) || 0;

  const { count: activeProjectsCount, error: activeProjectsError } = await supabase
    .from('projects')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'In Progress')
    .eq('workspace_id', workspaceId);
  if (activeProjectsError) throw new Error(activeProjectsError.message);

  const { count: pendingInvoicesCount, error: pendingInvoicesError } = await supabase
    .from('invoices')
    .select('*, projects!inner(workspace_id)', { count: 'exact', head: true })
    .in('status', ['Sent', 'Overdue'])
    .eq('projects.workspace_id', workspaceId);
  if (pendingInvoicesError) throw new Error(pendingInvoicesError.message);

  return { leadCount, clientCount, totalRevenue, activeProjectsCount, pendingInvoicesCount };
};

export const AnalyticsSummary = () => {
  const workspaceId = useWorkspaceId();
  const { data, isLoading } = useQuery({
    queryKey: ['analyticsSummary', workspaceId],
    queryFn: () => fetchAnalyticsSummary(workspaceId),
    enabled: !!workspaceId,
  });

  const summaryData = [
    { title: 'Total Revenue', value: data?.totalRevenue, icon: <DollarSign className="h-4 w-4 text-gray-600" />, format: 'currency' },
    { title: 'Total Clients', value: data?.clientCount, icon: <Users className="h-4 w-4 text-gray-600" />, format: 'number' },
    { title: 'Active Projects', value: data?.activeProjectsCount, icon: <Briefcase className="h-4 w-4 text-gray-600" />, format: 'number' },
    { title: 'Pending Invoices', value: data?.pendingInvoicesCount, icon: <FileClock className="h-4 w-4 text-gray-600" />, format: 'number' },
    { title: 'Lead Conversion', value: data?.leadCount ? ((data.clientCount ?? 0) / data.leadCount * 100) : 0, icon: <CheckCircle className="h-4 w-4 text-gray-600" />, format: 'percent' },
  ];

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="bg-white border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-2/3 bg-gray-100" />
              <Skeleton className="h-4 w-4 bg-gray-100" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-1/2 bg-gray-100" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
      {summaryData.map(item => (
        <Card key={item.title} className="bg-white border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-black">{item.title}</CardTitle>
            {item.icon}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-black">
              {item.format === 'currency' && '$'}
              {typeof item.value === 'number' ? item.value.toLocaleString(undefined, { maximumFractionDigits: item.format === 'percent' ? 1 : 0 }) : '0'}
              {item.format === 'percent' && '%'}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
