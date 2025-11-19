
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
import { DockNav } from '@/components/DockNav';
import { LoadingState } from '@/components/LoadingState';
import { PageHero } from '@/components/PageHero';

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
        return 'bg-[#F1F1F1] text-[#131313] border border-[#E0E0E0]';
      case 'booked':
        return 'bg-[#131313] text-[#FAF9F6] border border-[#131313]';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f7f4ef] via-[#f4f1ff] to-[#eef7ff] pb-32">
      <Header isAuthenticated={true} />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6">
        <PageHero
          title="Scheduling"
          description="Manage your meeting slots and appointments within a quiet, focused surface."
          actions={
            <Button onClick={() => setIsBookingDialogOpen(true)} className="rounded-full bg-[#131313] hover:bg-[#222222] text-white">
              <Plus className="w-4 h-4 mr-2" />
              Add Meeting Slot
            </Button>
          }
        />
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {isLoading ? (
            <div className="col-span-full">
              <LoadingState message="Loading meeting slots..." fullHeight />
            </div>
          ) : meetingSlots && meetingSlots.length > 0 ? (
            meetingSlots.map((slot) => (
              <Card key={slot.id} className="border border-white/70 bg-white hover:-translate-y-1 hover:shadow-[0_25px_80px_rgba(15,23,42,0.12)] transition-all duration-300">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2 text-[#131313]">
                      <Calendar className="w-5 h-5 text-[#131313]" />
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
              <Button onClick={() => setIsBookingDialogOpen(true)} className="bg-[#131313] hover:bg-[#222222] text-white">
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
      <DockNav />
    </div>
  );
};

export default SchedulingPage;
