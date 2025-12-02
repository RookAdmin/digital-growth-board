
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Area, AreaChart, CartesianGrid, XAxis, Tooltip } from 'recharts';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { format, parseISO } from 'date-fns';
import { useWorkspaceId } from '@/hooks/useWorkspaceId';

const fetchRevenueData = async (workspaceId: string | null) => {
  if (!workspaceId) return [];
  
  const { data, error } = await supabase
    .from('invoices')
    .select('total_amount, issued_date, project_id, projects!inner(workspace_id)')
    .eq('status', 'Paid')
    .eq('projects.workspace_id', workspaceId)
    .order('issued_date', { ascending: true });
    
  if (error) throw new Error(error.message);

  const monthlyRevenue: Record<string, number> = data.reduce((acc, invoice) => {
    if (!invoice.issued_date) return acc;
    const month = format(parseISO(invoice.issued_date), 'yyyy-MM-01');
    acc[month] = (acc[month] || 0) + (invoice.total_amount || 0);
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(monthlyRevenue).map(([month, revenue]) => ({ 
    month: format(parseISO(month), 'MMM yy'), 
    revenue 
  }));
};

export const RevenueChart = () => {
  const workspaceId = useWorkspaceId();
  const { data: chartData, isLoading } = useQuery({
    queryKey: ['revenueData', workspaceId],
    queryFn: () => fetchRevenueData(workspaceId),
    enabled: !!workspaceId,
  });

  const chartConfig = {
    revenue: { label: 'Revenue', color: 'hsl(var(--chart-5))' },
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-4 w-3/4" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-72 w-full" />
        </CardContent>
      </Card>
    );
  }

  const totalRevenue = chartData?.reduce((acc, curr) => acc + curr.revenue, 0) ?? 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue Over Time</CardTitle>
        <CardDescription>
          Total revenue from paid invoices: ${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-72 w-full">
          <AreaChart data={chartData} margin={{ left: 12, right: 12 }}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <Tooltip
              cursor={false}
              content={<ChartTooltipContent indicator="line" formatter={(value) => typeof value === 'number' ? value.toLocaleString('en-US', { style: 'currency', currency: 'USD' }) : ''} />}
            />
            <Area
              dataKey="revenue"
              type="natural"
              fill="var(--color-revenue)"
              fillOpacity={0.4}
              stroke="var(--color-revenue)"
              stackId="a"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};
