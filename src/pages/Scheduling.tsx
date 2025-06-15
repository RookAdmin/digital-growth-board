import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { MeetingSlot, Client } from '@/types';
import { Calendar, Clock, MapPin, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import { BookingDialog } from '@/components/BookingDialog';

const fetchMeetingSlots = async (): Promise<MeetingSlot[]> => {
  const { data, error } = await supabase
    .from('meeting_slots')
    .select(`
      *,
      clients:client_id (
        name,
        email
      )
    `)
    .order('date_time', { ascending: true });
  
  if (error) throw new Error(error.message);
  return data as MeetingSlot[];
};

const fetchClients = async (): Promise<Client[]> => {
  const { data, error } = await supabase
    .from('clients')
    .select('id, name, email')
    .order('name', { ascending: true });
  
  if (error) throw new Error(error.message);
  return data as Client[];
};

const bookMeetingSlot = async ({ slotId, clientId }: { slotId: string; clientId: string }) => {
  const { error } = await supabase
    .from('meeting_slots')
    .update({ 
      status: 'booked', 
      client_id: clientId,
      updated_at: new Date().toISOString()
    })
    .eq('id', slotId)
    .eq('status', 'available');
  
  if (error) throw new Error(error.message);
};

const SchedulingPage = () => {
  const queryClient = useQueryClient();
  const [selectedSlot, setSelectedSlot] = useState<MeetingSlot | null>(null);

  const { data: meetingSlots, isLoading } = useQuery({
    queryKey: ['meeting-slots'],
    queryFn: fetchMeetingSlots,
  });

  const { data: clients, isLoading: isLoadingClients } = useQuery({
    queryKey: ['clients'],
    queryFn: fetchClients,
  });

  const bookSlotMutation = useMutation({
    mutationFn: bookMeetingSlot,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meeting-slots'] });
      toast.success('Meeting slot booked successfully!');
      setSelectedSlot(null);
    },
    onError: (error) => {
      toast.error(`Failed to book slot: ${error.message}`);
    },
  });

  useEffect(() => {
    const channel = supabase.channel('realtime-meeting-slots')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'meeting_slots' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['meeting-slots'] });
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const availableSlots = meetingSlots?.filter(slot => slot.status === 'available') || [];
  const bookedSlots = meetingSlots?.filter(slot => slot.status === 'booked') || [];

  const handleBookSlot = (slotId: string, clientId: string) => {
    bookSlotMutation.mutate({ slotId, clientId });
  };

  if (isLoading || isLoadingClients) {
    return (
      <div className="flex flex-col h-screen bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading data...</p>
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
            <h1 className="text-3xl font-bold tracking-tight">Schedule Your Kickoff Meeting</h1>
            <p className="text-muted-foreground mt-2">
              Book a time that works best for you to discuss your project requirements.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Available Slots */}
            <div>
              <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                <Calendar className="h-6 w-6" />
                Available Time Slots
              </h2>
              
              {availableSlots.length === 0 ? (
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-center text-muted-foreground">
                      No available slots at the moment. Please check back later.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {availableSlots.map((slot) => (
                    <Card key={slot.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            {format(parseISO(slot.date_time), 'PPP')}
                          </CardTitle>
                          <Badge variant="secondary">Available</Badge>
                        </div>
                        <CardDescription className="flex items-center gap-4">
                          <span>{format(parseISO(slot.date_time), 'p')}</span>
                          <span>•</span>
                          <span>{slot.duration_minutes} minutes</span>
                          <span>•</span>
                          <span className="capitalize">{slot.meeting_type}</span>
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Button 
                          onClick={() => setSelectedSlot(slot)}
                          className="w-full"
                        >
                          Book This Slot
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Booked Slots */}
            <div>
              <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                <Users className="h-6 w-6" />
                Scheduled Meetings
              </h2>
              
              {bookedSlots.length === 0 ? (
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-center text-muted-foreground">
                      No meetings scheduled yet.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {bookedSlots.map((slot) => (
                    <Card key={slot.id}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            {format(parseISO(slot.date_time), 'PPP')}
                          </CardTitle>
                          <Badge>Booked</Badge>
                        </div>
                        <CardDescription className="flex items-center gap-4">
                          <span>{format(parseISO(slot.date_time), 'p')}</span>
                          <span>•</span>
                          <span>{slot.duration_minutes} minutes</span>
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {slot.clients && (
                          <div className="text-sm text-muted-foreground">
                            Client: {slot.clients.name}
                          </div>
                        )}
                        {slot.notes && (
                          <div className="text-sm text-muted-foreground mt-1">
                            Notes: {slot.notes}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      {selectedSlot && (
        <BookingDialog
          slot={selectedSlot}
          clients={clients || []}
          isOpen={!!selectedSlot}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedSlot(null);
            }
          }}
          onBook={(clientId) => {
            if (selectedSlot) {
              handleBookSlot(selectedSlot.id, clientId);
            }
          }}
          isBooking={bookSlotMutation.isPending}
        />
      )}
    </div>
  );
};

export default SchedulingPage;
