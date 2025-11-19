
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useClientAuth } from '@/hooks/useClientAuth';
import { DollarSign, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { pillClasses } from '@/constants/palette';

export const ClientInvoicesList = () => {
  const { clientUser } = useClientAuth();

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ['client-invoices', clientUser?.client_id],
    queryFn: async () => {
      if (!clientUser?.client_id) return [];
      
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('client_id', clientUser.client_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!clientUser?.client_id,
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Draft':
        return pillClasses.light;
      case 'Sent':
        return pillClasses.soft;
      case 'Paid':
        return pillClasses.dark;
      case 'Overdue':
        return pillClasses.charcoal;
      default:
        return pillClasses.light;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Invoices
        </CardTitle>
      </CardHeader>
      <CardContent>
        {invoices.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No invoices found. Your invoices will appear here when they're generated.
          </p>
        ) : (
          <div className="space-y-4">
            {invoices.map((invoice) => (
              <div key={invoice.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold">{invoice.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      #{invoice.invoice_number}
                    </p>
                  </div>
                  <Badge className={getStatusColor(invoice.status)} variant="secondary">
                    {invoice.status}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <span>Due: {format(new Date(invoice.due_date), 'MMM dd, yyyy')}</span>
                  </div>
                  <div className="flex items-center gap-1 font-semibold">
                    <DollarSign className="h-4 w-4" />
                    <span>${invoice.total_amount.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
