
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Pie, PieChart, Tooltip, Cell } from 'recharts';
import { ChartContainer, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
import { useWorkspaceId } from '@/hooks/useWorkspaceId';

const fetchProjectStatusData = async (workspaceId: string | null) => {
  if (!workspaceId) return [];
  
  const { data, error } = await supabase
    .from('projects')
    .select('status')
    .eq('workspace_id', workspaceId);
  if (error) throw new Error(error.message);

  const statusCounts = data.reduce((acc, project) => {
    const status = project.status || 'Unknown';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(statusCounts).map(([name, value]) => ({ 
    name, 
    value, 
    fill: `var(--color-${name.toLowerCase().replace(/ /g, '-')})` 
  }));
};

export const ProjectStatusChart = () => {
  const workspaceId = useWorkspaceId();
  const { data: chartData, isLoading } = useQuery({
    queryKey: ['projectStatusData', workspaceId],
    queryFn: () => fetchProjectStatusData(workspaceId),
    enabled: !!workspaceId,
  });

  const chartConfig = {
    'not-started': { label: 'Not Started', color: 'hsl(var(--chart-1))' },
    'in-progress': { label: 'In Progress', color: 'hsl(var(--chart-2))' },
    'review': { label: 'Review', color: 'hsl(var(--chart-3))' },
    'completed': { label: 'Completed', color: 'hsl(var(--chart-4))' },
    'unknown': { label: 'Unknown', color: 'hsl(var(--chart-5))' },
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

  const totalProjects = chartData?.reduce((acc, curr) => acc + curr.value, 0) ?? 0;

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle>Project Status</CardTitle>
        <CardDescription>A breakdown of all {totalProjects} projects by status.</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer config={chartConfig} className="mx-auto aspect-square h-64">
          <PieChart>
            <Tooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
            <Pie data={chartData} dataKey="value" nameKey="name" innerRadius={50} strokeWidth={5}>
              {chartData?.map((entry) => (
                <Cell key={entry.name} fill={entry.fill} />
              ))}
            </Pie>
            <ChartLegend content={<ChartLegendContent nameKey="name" />} />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};
