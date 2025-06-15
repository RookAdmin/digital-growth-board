
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { FileUploadPortal } from '@/components/FileUploadPortal';
import { Client } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FolderOpen } from 'lucide-react';

const fetchClients = async (): Promise<Client[]> => {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .order('name', { ascending: true });
  
  if (error) throw new Error(error.message);
  return data as Client[];
};

const FilesPage = () => {
  const [selectedClientId, setSelectedClientId] = useState<string>('');

  const { data: clients, isLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: fetchClients,
  });

  const selectedClient = clients?.find(client => client.id === selectedClientId);

  if (isLoading) {
    return (
      <div className="flex flex-col h-screen bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading clients...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <Header />
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-6 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Client File Portal</h1>
            <p className="text-muted-foreground mt-2">
              Secure file upload and management for client projects.
            </p>
          </div>

          <div className="mb-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FolderOpen className="h-5 w-5" />
                  Select Client
                </CardTitle>
                <CardDescription>
                  Choose a client to view and manage their files
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a client..." />
                  </SelectTrigger>
                  <SelectContent>
                    {clients?.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name} - {client.business_name || 'No business name'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          </div>

          {selectedClient && (
            <FileUploadPortal 
              clientId={selectedClient.id} 
              clientName={selectedClient.name} 
            />
          )}

          {!selectedClient && clients && clients.length > 0 && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-muted-foreground">
                  Please select a client to view and manage their files.
                </div>
              </CardContent>
            </Card>
          )}

          {clients && clients.length === 0 && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-muted-foreground">
                  No clients found. Convert some leads to clients first.
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default FilesPage;
