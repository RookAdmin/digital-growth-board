import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { RefreshCw, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { Header } from '@/components/Header';
import { DockNav } from '@/components/DockNav';

export const BackfillClientAuth = () => {
  const [isBackfilling, setIsBackfilling] = useState(false);

  // Fetch clients without auth users
  const { data: clientsWithoutAuth = [], isLoading, refetch } = useQuery({
    queryKey: ['clients-without-auth'],
    queryFn: async () => {
      const { data: allClients } = await supabase
        .from('clients')
        .select('id, name, email, phone');
      
      if (!allClients) return [];

      const { data: clientsWithAuth } = await supabase
        .from('client_users')
        .select('client_id');

      const authClientIds = new Set(clientsWithAuth?.map(c => c.client_id) || []);
      
      return allClients.filter(c => !authClientIds.has(c.id));
    },
  });

  // Backfill all clients
  const backfillMutation = useMutation({
    mutationFn: async () => {
      setIsBackfilling(true);
      const results = [];
      
      for (const client of clientsWithoutAuth) {
        try {
          const { data, error } = await supabase.functions.invoke('create-client-auth', {
            body: {
              client_id: client.id,
              email: client.email,
              phone: client.phone || '',
              name: client.name || client.email
            }
          });

          if (error) {
            results.push({ client, success: false, error: error.message });
          } else {
            results.push({ client, success: true });
          }
        } catch (err: any) {
          results.push({ client, success: false, error: err.message });
        }
      }

      return results;
    },
    onSuccess: (results) => {
      const successCount = results.filter(r => r.success).length;
      const failCount = results.filter(r => !r.success).length;
      
      toast.success(`Backfill complete: ${successCount} succeeded, ${failCount} failed`);
      refetch();
      setIsBackfilling(false);
    },
    onError: (error) => {
      toast.error(`Backfill failed: ${error.message}`);
      setIsBackfilling(false);
    },
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f7f4ef] via-[#f4f1ff] to-[#eef7ff] pb-32">
      <Header isAuthenticated={true} />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle>Backfill Client Auth Users</CardTitle>
            <CardDescription>
              Create authentication accounts for clients that don't have login credentials yet.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="text-center py-8">Loading...</div>
            ) : clientsWithoutAuth.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <p className="text-lg font-semibold text-gray-900">All clients have auth users!</p>
                <p className="text-sm text-gray-600 mt-2">No action needed.</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">
                      {clientsWithoutAuth.length} client(s) without authentication accounts
                    </p>
                  </div>
                  <Button
                    onClick={() => backfillMutation.mutate()}
                    disabled={isBackfilling}
                  >
                    {isBackfilling ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Create Auth Users for All
                      </>
                    )}
                  </Button>
                </div>
                <div className="border rounded-lg divide-y max-h-96 overflow-y-auto">
                  {clientsWithoutAuth.map((client) => (
                    <div key={client.id} className="p-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{client.name || 'Unnamed'}</p>
                        <p className="text-sm text-gray-600">{client.email}</p>
                      </div>
                      <AlertCircle className="h-5 w-5 text-yellow-600" />
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </main>
      <DockNav />
    </div>
  );
};

