
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Client } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { Trash2, Users } from 'lucide-react';
import { EditClientDialog } from './EditClientDialog';
import { Country, State } from 'country-state-city';

const fetchClients = async (): Promise<Client[]> => {
  const { data, error } = await supabase.from('clients').select('*').order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data;
};

export const ClientsTable = () => {
  const { data: clients, isLoading, error } = useQuery({
    queryKey: ['clients'],
    queryFn: fetchClients,
  });

  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const deleteClientMutation = useMutation({
    mutationFn: async (clientId: string) => {
      const { error } = await supabase.from('clients').delete().eq('id', clientId);
      if (error) {
        throw new Error(error.message);
      }
    },
    onSuccess: () => {
      toast({
        title: "Client Deleted",
        description: "The client and all associated data have been successfully deleted.",
      });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setClientToDelete(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error Deleting Client",
        description: `An unexpected error occurred: ${error.message}`,
        variant: "destructive",
      });
      setClientToDelete(null);
    },
  });

  const handleDeleteClient = () => {
    if (clientToDelete) {
      deleteClientMutation.mutate(clientToDelete.id);
    }
  };

  const getLocationDisplay = (client: any) => {
    const parts = [];
    
    if (client.city) parts.push(client.city);
    if (client.state) {
      const state = State.getStateByCodeAndCountry(client.state, client.country);
      parts.push(state?.name || client.state);
    }
    if (client.country) {
      const country = Country.getCountryByCode(client.country);
      parts.push(country?.name || client.country);
    }
    
    return parts.length > 0 ? parts.join(', ') : '-';
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-12 w-full bg-white/40" />
        <Skeleton className="h-12 w-full bg-white/40" />
        <Skeleton className="h-12 w-full bg-white/40" />
      </div>
    );
  }

  if (error instanceof Error) {
    return (
      <div className="p-6">
        <div className="text-red-600 bg-red-50/80 backdrop-blur-sm p-4 rounded-xl border border-red-200/50">
          Error fetching clients: {error.message}
        </div>
      </div>
    );
  }
  
  if (!clients || clients.length === 0) {
    return (
      <div className="p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
          <Users className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No clients yet</h3>
        <p className="text-gray-500">You haven't converted any leads to clients. Go to the dashboard to convert some!</p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-hidden rounded-2xl">
        <Table>
          <TableHeader>
            <TableRow className="border-0 bg-gray-50/50">
              <TableHead className="font-semibold text-gray-900 py-4 px-6">Name</TableHead>
              <TableHead className="font-semibold text-gray-900 py-4 px-6">Email</TableHead>
              <TableHead className="font-semibold text-gray-900 py-4 px-6">Phone</TableHead>
              <TableHead className="font-semibold text-gray-900 py-4 px-6">Business Name</TableHead>
              <TableHead className="font-semibold text-gray-900 py-4 px-6">Location</TableHead>
              <TableHead className="font-semibold text-gray-900 py-4 px-6 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients?.map((client, index) => (
              <TableRow 
                key={client.id}
                className={`border-0 hover:bg-gray-50/30 transition-colors ${
                  index < clients.length - 1 ? 'border-b border-gray-100/50' : ''
                }`}
              >
                <TableCell className="font-medium text-gray-900 py-4 px-6">{client.name}</TableCell>
                <TableCell className="text-gray-600 py-4 px-6">{client.email}</TableCell>
                <TableCell className="text-gray-600 py-4 px-6">{client.phone || '-'}</TableCell>
                <TableCell className="text-gray-600 py-4 px-6">{client.business_name || '-'}</TableCell>
                <TableCell className="text-gray-600 py-4 px-6">{getLocationDisplay(client)}</TableCell>
                <TableCell className="text-right py-4 px-6">
                  <div className="flex gap-2 justify-end">
                    <EditClientDialog client={client} />
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setClientToDelete(client)}
                      className="bg-red-500 hover:bg-red-600 text-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {clientToDelete && (
        <AlertDialog open={!!clientToDelete} onOpenChange={(open) => !open && setClientToDelete(null)}>
          <AlertDialogContent className="modern-card border-0">
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the client "{clientToDelete.name}" and all associated data (projects, invoices, files, etc.).
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel 
                onClick={() => setClientToDelete(null)}
                className="modern-button border border-gray-300/50 bg-white/60 backdrop-blur-sm text-gray-700 hover:bg-white/80"
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteClient}
                disabled={deleteClientMutation.isPending}
                className="modern-button bg-red-500 hover:bg-red-600 text-white"
              >
                {deleteClientMutation.isPending ? 'Deleting...' : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
};
