import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { MeetingSlot, Client } from '@/types';
import { Calendar, Clock, Users, X, Link as LinkIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { format, parseISO, addDays, startOfDay, endOfDay, setHours, isWithinInterval, addMinutes, isBefore } from 'date-fns';
import { BookingDialog } from '@/components/BookingDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

const fetchMeetingSlots = async (): Promise<MeetingSlot[]> => {
  const { data, error } = await supabase
    .from('meeting_slots')
    .select(`
      *,
      meeting_link,
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

const createMeetingSlot = async ({ dateTime, duration, clientId }: { dateTime: Date; duration: number; clientId: string }) => {
  const { error } = await supabase
    .from('meeting_slots')
    .insert({ 
      date_time: dateTime.toISOString(),
      duration_minutes: duration,
      status: 'booked', 
      client_id: clientId,
      meeting_type: 'kickoff',
      meeting_link: 'https://meet.google.com/brv-sida-fuy'
    });
  
  if (error) throw new Error(error.message);
};

const updateMeetingSlot = async ({ slotId, dateTime, duration }: { slotId: string, dateTime: Date, duration?: number }) => {
  const updatePayload: { date_time: string; duration_minutes?: number } = {
    date_time: dateTime.toISOString(),
  };

  if (duration) {
    updatePayload.duration_minutes = duration;
  }
  
  const { error } = await supabase
    .from('meeting_slots')
    .update(updatePayload)
    .eq('id', slotId);

  if (error) {
    throw new Error(error.message);
  }
};

const deleteMeetingSlot = async (slotId: string) => {
  const { error } = await supabase
    .from('meeting_slots')
    .delete()
    .eq('id', slotId);
  
  if (error) throw new Error(error.message);
};

const generateAvailableSlots = (bookedSlots: MeetingSlot[]): MeetingSlot[] => {
    const potentialSlots: MeetingSlot[] = [];
    const slotInterval = 30; // Use 30-minute intervals for generating potential start times

    for (let i = 0; i < 7; i++) { // For the next 7 days
        const day = addDays(new Date(), i);
        const dayStart = setHours(startOfDay(day), 9);
        const dayEnd = setHours(startOfDay(day), 22);

        let currentTime = dayStart;
        while (isBefore(currentTime, dayEnd)) {
            potentialSlots.push({
                id: `virtual-${currentTime.toISOString()}`,
                date_time: currentTime.toISOString(),
                duration_minutes: slotInterval, // This is just a base for the available slot, actual duration is set on booking
                status: 'available',
                client_id: null,
                meeting_type: 'kickoff',
                notes: null,
                meeting_link: null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            });
            currentTime = addMinutes(currentTime, slotInterval);
        }
    }
    
    const bookedIntervals = bookedSlots.map(slot => ({
        start: parseISO(slot.date_time),
        end: addMinutes(parseISO(slot.date_time), slot.duration_minutes),
    }));

    const availableSlots = potentialSlots.filter(potentialSlot => {
        const slotStart = parseISO(potentialSlot.date_time);
        const slotEnd = addMinutes(slotStart, potentialSlot.duration_minutes);

        if (isBefore(slotStart, new Date())) {
            return false;
        }

        const overlaps = bookedIntervals.some(bookedInterval => 
            isBefore(slotStart, bookedInterval.end) && isBefore(bookedInterval.start, slotEnd)
        );

        return !overlaps;
    });
    
    return availableSlots;
};

const SchedulingPage = () => {
  const queryClient = useQueryClient();
  const [selectedSlot, setSelectedSlot] = useState<MeetingSlot | null>(null);
  const [slotToReschedule, setSlotToReschedule] = useState<MeetingSlot | null>(null);
  const [rescheduleConfirmationOpen, setRescheduleConfirmationOpen] = useState(false);
  const [newSlotForReschedule, setNewSlotForReschedule] = useState<MeetingSlot | null>(null);
  const [newDurationForReschedule, setNewDurationForReschedule] = useState<number | null>(null);

  const { data: meetingSlots, isLoading } = useQuery({
    queryKey: ['meeting-slots'],
    queryFn: fetchMeetingSlots,
  });

  const { data: clients, isLoading: isLoadingClients } = useQuery({
    queryKey: ['clients'],
    queryFn: fetchClients,
  });

  const createSlotMutation = useMutation({
    mutationFn: createMeetingSlot,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meeting-slots'] });
      toast.success('Meeting slot booked successfully!');
      setSelectedSlot(null);
    },
    onError: (error) => {
      toast.error(`Failed to book slot: ${error.message}`);
    },
  });

  const updateSlotMutation = useMutation({
    mutationFn: updateMeetingSlot,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meeting-slots'] });
      toast.success('Meeting rescheduled successfully!');
      setSlotToReschedule(null);
      setNewSlotForReschedule(null);
      setNewDurationForReschedule(null);
    },
    onError: (error) => {
      toast.error(`Failed to reschedule meeting: ${error.message}`);
      setSlotToReschedule(null);
      setNewSlotForReschedule(null);
      setNewDurationForReschedule(null);
    },
  });

  const deleteSlotMutation = useMutation({
    mutationFn: deleteMeetingSlot,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meeting-slots'] });
      toast.success('Meeting cancelled successfully!');
    },
    onError: (error) => {
      toast.error(`Failed to cancel meeting: ${error.message}`);
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

  const bookedSlots = useMemo(() => meetingSlots?.filter(slot => slot.status === 'booked') || [], [meetingSlots]);
  const availableSlots = useMemo(() => {
    if (!meetingSlots) return [];
    const bSlots = meetingSlots.filter(slot => slot.status === 'booked');
    return generateAvailableSlots(bSlots);
  }, [meetingSlots]);

  const handleCreateSlot = (clientId: string, duration: number) => {
    if (selectedSlot) {
      createSlotMutation.mutate({
        dateTime: parseISO(selectedSlot.date_time),
        duration: duration,
        clientId,
      });
    }
  };

  const handleRescheduleClick = (slot: MeetingSlot) => {
    setSlotToReschedule(slot);
    toast.info("Select a new available time slot from the list.");
  };

  const handleAvailableSlotClick = (availableSlot: MeetingSlot) => {
    if (slotToReschedule) {
      setNewSlotForReschedule(availableSlot);
      setNewDurationForReschedule(slotToReschedule.duration_minutes);
      setRescheduleConfirmationOpen(true);
    } else {
      setSelectedSlot(availableSlot);
    }
  };

  const confirmReschedule = () => {
    if (slotToReschedule && newSlotForReschedule && newDurationForReschedule) {
      const newStartTime = parseISO(newSlotForReschedule.date_time);
      const newEndTime = addMinutes(newStartTime, newDurationForReschedule);

      const otherBookedSlots = bookedSlots.filter(s => s.id !== slotToReschedule.id);
      const bookedIntervals = otherBookedSlots.map(s => ({
          start: parseISO(s.date_time),
          end: addMinutes(parseISO(s.date_time), s.duration_minutes),
      }));

      const overlaps = bookedIntervals.some(bookedInterval => 
          isBefore(newStartTime, bookedInterval.end) && isBefore(bookedInterval.start, newEndTime)
      );

      if (overlaps) {
        toast.error("The new time slot with this duration overlaps with another scheduled meeting.");
        setRescheduleConfirmationOpen(false);
        return;
      }

      updateSlotMutation.mutate({
        slotId: slotToReschedule.id,
        dateTime: parseISO(newSlotForReschedule.date_time),
        duration: newDurationForReschedule,
      });
    }
    setRescheduleConfirmationOpen(false);
  };

  const durationOptions = [
    { value: "30", label: "30 minutes" },
    { value: "60", label: "1 hour" },
    { value: "90", label: "1 hour 30 minutes" },
    { value: "120", label: "2 hours" },
  ];

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
              {slotToReschedule 
                ? `Rescheduling meeting for ${slotToReschedule.clients?.name}. Please select a new slot.`
                : 'Book a time that works best for you to discuss your project requirements.'
              }
            </p>
            {slotToReschedule && (
                <Button variant="outline" size="sm" onClick={() => setSlotToReschedule(null)} className="mt-2">
                    Cancel Reschedule
                </Button>
            )}
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
                    <Card key={slot.id} className={`hover:shadow-md transition-shadow ${slotToReschedule ? 'cursor-pointer' : ''}`}>
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
                          onClick={() => handleAvailableSlotClick(slot)}
                          className="w-full"
                          disabled={updateSlotMutation.isPending}
                        >
                          {slotToReschedule ? 'Reschedule to this Slot' : 'Book This Slot'}
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
                        {slot.meeting_link && (
                          <div className="text-sm text-muted-foreground mt-2 flex items-center gap-2">
                            <LinkIcon className="h-4 w-4" />
                            <a href={slot.meeting_link} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate">
                              {slot.meeting_link}
                            </a>
                          </div>
                        )}
                        {slot.notes && (
                          <div className="text-sm text-muted-foreground mt-1">
                            Notes: {slot.notes}
                          </div>
                        )}
                        <div className="flex gap-2 mt-4">
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={() => handleRescheduleClick(slot)}
                            disabled={updateSlotMutation.isPending || (deleteSlotMutation.isPending && deleteSlotMutation.variables === slot.id)}
                          >
                            <Calendar className="h-4 w-4 mr-2" />
                            Reschedule
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm" 
                            className="w-full"
                            onClick={() => deleteSlotMutation.mutate(slot.id)}
                            disabled={(deleteSlotMutation.isPending && deleteSlotMutation.variables === slot.id) || updateSlotMutation.isPending}
                          >
                            {deleteSlotMutation.isPending && deleteSlotMutation.variables === slot.id ? (
                              'Cancelling...'
                            ) : (
                              <>
                                <X className="h-4 w-4 mr-2" />
                                Cancel Meeting
                              </>
                            )}
                          </Button>
                        </div>
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
          bookedSlots={bookedSlots}
          isOpen={!!selectedSlot}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedSlot(null);
            }
          }}
          onBook={handleCreateSlot}
          isBooking={createSlotMutation.isPending}
        />
      )}
      <AlertDialog open={rescheduleConfirmationOpen} onOpenChange={setRescheduleConfirmationOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Confirm Reschedule</AlertDialogTitle>
                <AlertDialogDescription>
                    Are you sure you want to move this meeting from{' '}
                    <strong>{slotToReschedule && format(parseISO(slotToReschedule.date_time), 'PPP p')}</strong> to {' '}
                    <strong>{newSlotForReschedule && format(parseISO(newSlotForReschedule.date_time), 'PPP p')}</strong>?
                    You can also adjust the meeting duration.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4 space-y-2">
                <Label htmlFor="duration">Duration</Label>
                <Select
                    value={newDurationForReschedule?.toString()}
                    onValueChange={(value) => setNewDurationForReschedule(parseInt(value, 10))}
                >
                    <SelectTrigger id="duration">
                        <SelectValue placeholder="Select a duration" />
                    </SelectTrigger>
                    <SelectContent>
                        {durationOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                                {option.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => { setSlotToReschedule(null); setNewSlotForReschedule(null); setNewDurationForReschedule(null); }}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={confirmReschedule} disabled={updateSlotMutation.isPending}>
                  {updateSlotMutation.isPending ? 'Rescheduling...' : 'Confirm'}
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </div>
  );
};

export default SchedulingPage;
