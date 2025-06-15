
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Briefcase, DollarSign, FileClock, CheckCircle } from 'lucide-react';

const fetchAnalyticsSummary = async () => {
  const { count: leadCount, error: leadError } = await supabase.from('leads').select('*', { count: 'exact', head: true });
  if (leadError) throw new Error(leadError.message);

  const { count: clientCount, error: clientError } = await supabase.from('clients').select('*', { count: 'exact', head: true });
  if (clientError) throw new Error(clientError.message);
  
  const { data: paidInvoices, error: invoiceError } = await supabase.from('invoices').select('total_amount').eq('status', 'Paid');
  if (invoiceError) throw new Error(invoiceError.message);
  const totalRevenue = paidInvoices?.reduce((sum, inv) => sum + (inv.total_amount || 0), 0) || 0;

  const { count: activeProjectsCount, error: activeProjectsError } = await supabase.from('projects').select('*', { count: 'exact', head: true }).eq('status', 'In Progress');
  if (activeProjectsError) throw new Error(activeProjectsError.message);

  const { count: pendingInvoicesCount, error: pendingInvoicesError } = await supabase.from('invoices').select('*', { count: 'exact', head: true }).in('status', ['Sent', 'Overdue']);
  if (pendingInvoicesError) throw new Error(pendingInvoicesError.message);

  return { leadCount, clientCount, totalRevenue, activeProjectsCount, pendingInvoicesCount };
};


export const AnalyticsSummary = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['analyticsSummary'],
    queryFn: fetchAnalyticsSummary,
  });

  const summaryData = [
    { title: 'Total Revenue', value: data?.totalRevenue, icon: <DollarSign className="h-4 w-4 text-muted-foreground" />, format: 'currency' },
    { title: 'Total Clients', value: data?.clientCount, icon: <Users className="h-4 w-4 text-muted-foreground" />, format: 'number' },
    { title: 'Active Projects', value: data?.activeProjectsCount, icon: <Briefcase className="h-4 w-4 text-muted-foreground" />, format: 'number' },
    { title: 'Pending Invoices', value: data?.pendingInvoicesCount, icon: <FileClock className="h-4 w-4 text-muted-foreground" />, format: 'number' },
    { title: 'Lead Conversion', value: data?.leadCount ? ((data.clientCount ?? 0) / data.leadCount * 100) : 0, icon: <CheckCircle className="h-4 w-4 text-muted-foreground" />, format: 'percent' },
  ];

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
        {[...Array(5)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
      {summaryData.map(item => (
        <Card key={item.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
            {item.icon}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
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
