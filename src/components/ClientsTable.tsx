
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Client } from '@/types';
import { useNavigate } from 'react-router-dom';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useState, useMemo } from 'react';
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

interface ClientsTableProps {
  searchTerm?: string;
  startDate?: Date;
  endDate?: Date;
  singleDate?: Date;
  statusFilter?: string;
}

export const ClientsTable = ({
  searchTerm = '',
  startDate,
  endDate,
  singleDate,
  statusFilter = 'all',
}: ClientsTableProps) => {
  const navigate = useNavigate();
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

  const filteredClients = useMemo(() => {
    if (!clients) return [];
    
    return clients.filter(client => {
      // Search filter
      const term = searchTerm.toLowerCase();
      const matchesSearch = !term || (
        client.name.toLowerCase().includes(term) ||
        client.email.toLowerCase().includes(term) ||
        (client.phone && client.phone.toLowerCase().includes(term)) ||
        (client.business_name && client.business_name.toLowerCase().includes(term))
      );

      // Journey filter
      const normalizedStatus = (client.onboarding_status || '').toLowerCase();
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && normalizedStatus.includes('active')) ||
        (statusFilter === 'onboarding' && (normalizedStatus.includes('onboard') || normalizedStatus.includes('setup'))) ||
        (statusFilter === 'paused' &&
          (normalizedStatus.includes('pause') ||
            normalizedStatus.includes('dormant') ||
            normalizedStatus.includes('hold'))) ||
        (statusFilter === 'completed' &&
          (normalizedStatus.includes('complete') ||
            normalizedStatus.includes('wrapped'))) ||
        normalizedStatus === statusFilter.toLowerCase();

      // Single date filter (creation date)
      const matchesDate = !singleDate || 
        new Date(client.created_at).toDateString() === singleDate.toDateString();

      // Date range filter
      let matchesDateRange = true;
      if (startDate || endDate) {
        const createdDate = new Date(client.created_at);
        if (startDate) {
          matchesDateRange = matchesDateRange && createdDate >= startDate;
        }
        if (endDate) {
          const endOfDay = new Date(endDate);
          endOfDay.setHours(23, 59, 59, 999);
          matchesDateRange = matchesDateRange && createdDate <= endOfDay;
        }
      }

      return matchesSearch && matchesStatus && matchesDate && matchesDateRange;
    });
  }, [clients, searchTerm, statusFilter, startDate, endDate, singleDate]);

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
        <Skeleton className="h-12 w-full bg-gray-100" />
        <Skeleton className="h-12 w-full bg-gray-100" />
        <Skeleton className="h-12 w-full bg-gray-100" />
      </div>
    );
  }

  if (error instanceof Error) {
    return (
      <div className="p-6">
        <div className="text-red-600 bg-red-50 p-4 rounded-xl border border-red-200">
          Error fetching clients: {error.message}
        </div>
      </div>
    );
  }
  
  if (!clients || clients.length === 0) {
    return (
      <div className="p-8 text-center bg-white">
        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
          <Users className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No clients yet</h3>
        <p className="text-gray-500">You haven't converted any leads to clients. Go to the dashboard to convert some!</p>
      </div>
    );
  }

  if (filteredClients.length === 0 && (searchTerm || startDate || endDate || singleDate)) {
    return (
      <div className="p-8 text-center bg-white">
        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
          <Users className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No clients found</h3>
        <p className="text-gray-500">No clients match your current filters. Try adjusting your search criteria.</p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-hidden rounded-xl bg-white">
        <Table>
          <TableHeader>
            <TableRow className="border-0 bg-gray-50">
              <TableHead className="font-semibold text-gray-900 py-4 px-6">Name</TableHead>
              <TableHead className="font-semibold text-gray-900 py-4 px-6">Email</TableHead>
              <TableHead className="font-semibold text-gray-900 py-4 px-6">Phone</TableHead>
              <TableHead className="font-semibold text-gray-900 py-4 px-6">Business Name</TableHead>
              <TableHead className="font-semibold text-gray-900 py-4 px-6">Location</TableHead>
              <TableHead className="font-semibold text-gray-900 py-4 px-6 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredClients?.map((client, index) => (
              <TableRow 
                key={client.id}
                className={`border-0 hover:bg-gray-50 transition-colors cursor-pointer ${
                  index < filteredClients.length - 1 ? 'border-b border-gray-100' : ''
                }`}
                onClick={() => navigate(`/clients/${client.id}`)}
              >
                <TableCell className="font-medium text-gray-900 py-4 px-6">{client.name}</TableCell>
                <TableCell className="text-gray-600 py-4 px-6">{client.email}</TableCell>
                <TableCell className="text-gray-600 py-4 px-6">{client.phone || '-'}</TableCell>
                <TableCell className="text-gray-600 py-4 px-6">{client.business_name || '-'}</TableCell>
                <TableCell className="text-gray-600 py-4 px-6">{getLocationDisplay(client)}</TableCell>
                <TableCell className="text-right py-4 px-6">
                  <div className="flex gap-2 justify-end" onClick={(e) => e.stopPropagation()}>
                    <EditClientDialog client={client} />
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setClientToDelete(client);
                      }}
                      className="bg-red-600 hover:bg-red-700 hover:text-white text-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300"
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
          <AlertDialogContent className="bg-white border border-gray-200 rounded-xl shadow-lg">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-gray-900">Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription className="text-gray-600">
                This action cannot be undone. This will permanently delete the client "{clientToDelete.name}" and all associated data (projects, invoices, files, etc.).
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel 
                onClick={() => setClientToDelete(null)}
                className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-xl"
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteClient}
                disabled={deleteClientMutation.isPending}
                className="bg-red-600 text-white hover:bg-red-700 hover:text-white rounded-xl"
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
