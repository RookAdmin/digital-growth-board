
import { useEffect, useState } from "react";
import { Header } from '@/components/Header';
import { Calendar, Clock, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { AddMeetingSlotDialog } from '@/components/AddMeetingSlotDialog';

const SchedulingPage = () => {
  const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(false);

  useEffect(() => {
    document.title = "Scheduling - Rook";
  }, []);

  const { data: meetingSlots, isLoading, refetch } = useQuery({
    queryKey: ['meeting-slots'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('meeting_slots')
        .select('*, clients(name, email)')
        .order('date_time', { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'booked':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Header isAuthenticated={true} />
      
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-black">Scheduling</h1>
            <p className="text-sm sm:text-base lg:text-lg text-gray-600 mt-1 font-light">Manage your meeting slots and appointments.</p>
          </div>
          <Button onClick={() => setIsBookingDialogOpen(true)} className="bg-black hover:bg-gray-800 text-white">
            <Plus className="w-4 h-4 mr-2" />
            Add Meeting Slot
          </Button>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {isLoading ? (
            <div className="col-span-full flex items-center justify-center py-8">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-gray-500">Loading meeting slots...</p>
              </div>
            </div>
          ) : meetingSlots && meetingSlots.length > 0 ? (
            meetingSlots.map((slot) => (
              <Card key={slot.id} className="border border-gray-200 hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-black" />
                      {format(new Date(slot.date_time), 'MMM dd, yyyy')}
                    </CardTitle>
                    <Badge className={getStatusColor(slot.status)}>
                      {slot.status}
                    </Badge>
                  </div>
                  <CardDescription className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    {format(new Date(slot.date_time), 'hh:mm a')} ({slot.duration_minutes} min)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Type:</span> {slot.meeting_type || 'General'}
                    </p>
                    {slot.clients && (
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Client:</span> {slot.clients.name}
                      </p>
                    )}
                    {slot.notes && (
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Notes:</span> {slot.notes}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-8">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">No meeting slots scheduled</p>
              <Button onClick={() => setIsBookingDialogOpen(true)} className="bg-black hover:bg-gray-800 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Schedule Your First Meeting
              </Button>
            </div>
          )}
        </div>
      </main>

      <AddMeetingSlotDialog
        open={isBookingDialogOpen}
        onOpenChange={setIsBookingDialogOpen}
        onSuccess={() => refetch()}
      />
    </div>
  );
};

export default SchedulingPage;
