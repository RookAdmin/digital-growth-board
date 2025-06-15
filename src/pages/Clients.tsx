
import { Header } from '@/components/Header';
import { ClientsTable } from '@/components/ClientsTable';
import { useSearchParams } from 'react-router-dom';
import { OnboardingModal } from '@/components/OnboardingModal';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
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
import { Trash2 } from 'lucide-react';

const ClientsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const onboardingClientId = searchParams.get('onboarding');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleCloseModal = () => {
    searchParams.delete('onboarding');
    setSearchParams(searchParams);
  };

  const deleteAllClientsMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('clients').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (error) {
        throw new Error(error.message);
      }
    },
    onSuccess: () => {
      toast({
        title: "All Clients Deleted",
        description: "All client records have been permanently removed.",
      });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setIsDeleteDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error Deleting Clients",
        description: `Failed to delete clients. This may be because some clients are still linked to projects. ${error.message}`,
        variant: "destructive",
      });
      setIsDeleteDialogOpen(false);
    },
  });

  return (
    <div className="flex flex-col h-screen bg-background">
      <Header />
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="px-6 pt-6 pb-2 flex justify-between items-center flex-shrink-0">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
            <p className="text-muted-foreground">A list of all your converted clients.</p>
          </div>
          <Button variant="destructive" onClick={() => setIsDeleteDialogOpen(true)} disabled={deleteAllClientsMutation.isPending}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete All Clients
          </Button>
        </div>
        <div className="p-6 flex-1 overflow-y-auto">
          <ClientsTable />
        </div>
      </main>
      {onboardingClientId && (
        <OnboardingModal
          clientId={onboardingClientId}
          isOpen={!!onboardingClientId}
          onClose={handleCloseModal}
        />
      )}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete ALL client records.
              If clients are associated with projects, this action may fail.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteAllClientsMutation.mutate()}
              disabled={deleteAllClientsMutation.isPending}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleteAllClientsMutation.isPending ? 'Deleting...' : 'Yes, delete all'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ClientsPage;
