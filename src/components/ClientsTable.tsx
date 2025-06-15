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
import { Trash2 } from 'lucide-react';

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

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-1/4" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error instanceof Error) {
    return <p className="text-red-500">Error fetching clients: {error.message}</p>;
  }
  
  if (!clients || clients.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Clients Yet</CardTitle>
        </CardHeader>
        <CardContent>
          <p>You haven't converted any leads to clients. Go to the dashboard to convert some!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-bold">Name</TableHead>
                <TableHead className="font-bold">Email</TableHead>
                <TableHead className="font-bold">Phone</TableHead>
                <TableHead className="font-bold">Business Name</TableHead>
                <TableHead className="font-bold text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients?.map((client) => (
                <TableRow key={client.id}>
                  <TableCell>{client.name}</TableCell>
                  <TableCell>{client.email}</TableCell>
                  <TableCell>{client.phone || '-'}</TableCell>
                  <TableCell>{client.business_name || '-'}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => setClientToDelete(client)}
                      className="h-8 w-8"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete client</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {clientToDelete && (
        <AlertDialog open={!!clientToDelete} onOpenChange={(open) => !open && setClientToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the client "{clientToDelete.name}" and all associated data (projects, invoices, files, etc.).
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setClientToDelete(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteClient}
                disabled={deleteClientMutation.isPending}
                className="bg-destructive hover:bg-destructive/90"
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
