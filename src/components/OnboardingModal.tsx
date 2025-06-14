
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Client, ClientOnboardingData } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { OnboardingForm } from './OnboardingForm';
import { Skeleton } from './ui/skeleton';
import { ScrollArea } from './ui/scroll-area';

interface OnboardingModalProps {
  clientId: string;
  isOpen: boolean;
  onClose: () => void;
}

const fetchClientData = async (clientId: string) => {
  const { data, error } = await supabase.from('clients').select('*').eq('id', clientId).single();
  if (error) throw new Error(error.message);
  return data as Client;
};

const fetchOnboardingData = async (clientId: string) => {
  const { data, error } = await supabase.from('client_onboarding_data').select('*').eq('client_id', clientId).maybeSingle();
  if (error) throw new Error(error.message);
  return data as ClientOnboardingData | null;
};

export const OnboardingModal = ({ clientId, isOpen, onClose }: OnboardingModalProps) => {
  const { data: client, isLoading: isLoadingClient } = useQuery({
    queryKey: ['client', clientId],
    queryFn: () => fetchClientData(clientId),
    enabled: !!clientId && isOpen,
  });

  const { data: onboardingData, isLoading: isLoadingOnboarding } = useQuery({
    queryKey: ['onboarding_data', clientId],
    queryFn: () => fetchOnboardingData(clientId),
    enabled: !!clientId && isOpen,
  });

  const isLoading = isLoadingClient || isLoadingOnboarding;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl h-[90vh]">
        <ScrollArea className="h-full pr-6">
          <DialogHeader>
            <DialogTitle className="text-2xl">Client Onboarding</DialogTitle>
            {client && <DialogDescription>Fill out the onboarding form for {client.name}.</DialogDescription>}
          </DialogHeader>
          <div className="mt-6">
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-8 w-1/2" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : client ? (
              <OnboardingForm client={client} onboardingData={onboardingData} onClose={onClose} />
            ) : (
              <p>Could not load client data.</p>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
