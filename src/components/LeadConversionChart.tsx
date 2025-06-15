
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Bar, BarChart, XAxis, YAxis, Tooltip } from 'recharts';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';

const fetchLeadConversionData = async () => {
  const { count: leadCount, error: leadError } = await supabase.from('leads').select('*', { count: 'exact', head: true });
  if (leadError) throw new Error(leadError.message);

  const { count: clientCount, error: clientError } = await supabase.from('clients').select('*', { count: 'exact', head: true });
  if (clientError) throw new Error(clientError.message);
  
  return { leadCount, clientCount };
};

export const LeadConversionChart = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['leadConversionData'],
    queryFn: fetchLeadConversionData,
  });

  const chartData = [
    { name: 'Leads', value: data?.leadCount ?? 0, fill: 'var(--color-leads)' },
    { name: 'Clients', value: data?.clientCount ?? 0, fill: 'var(--color-clients)' },
  ];

  const conversionRate = data?.leadCount ? ((data.clientCount ?? 0) / data.leadCount * 100).toFixed(1) : 0;

  const chartConfig = {
    leads: { label: 'Leads', color: 'hsl(var(--chart-2))' },
    clients: { label: 'Clients', color: 'hsl(var(--chart-1))' },
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-4 w-3/4" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Lead Funnel</CardTitle>
        <CardDescription>
          Your conversion rate is {conversionRate}%.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-64">
          <BarChart data={chartData} layout="vertical" margin={{ left: 10 }}>
            <XAxis type="number" hide />
            <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} width={80} />
            <Tooltip cursor={{ fill: 'hsl(var(--muted))' }} content={<ChartTooltipContent />} />
            <Bar dataKey="value" radius={5} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};
