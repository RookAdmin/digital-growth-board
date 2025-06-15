
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { MeetingSlot, Client } from '@/types';
import { format, parseISO, addMinutes, isBefore } from 'date-fns';

interface BookingDialogProps {
  slot: MeetingSlot;
  clients: Client[];
  bookedSlots: MeetingSlot[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onBook: (clientId: string, duration: number) => void;
  isBooking: boolean;
}

const formSchema = z.object({
  clientId: z.string({
    required_error: "Please select a client.",
  }).min(1, { message: "Please select a client." }),
  duration: z.string().min(1, { message: "Please select a duration." }),
});

export const BookingDialog = ({ slot, clients, bookedSlots, isOpen, onOpenChange, onBook, isBooking }: BookingDialogProps) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      duration: "60",
    }
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const duration = parseInt(values.duration, 10);
    const startTime = parseISO(slot.date_time);
    const endTime = addMinutes(startTime, duration);

    const bookedIntervals = bookedSlots.map(s => ({
        start: parseISO(s.date_time),
        end: addMinutes(parseISO(s.date_time), s.duration_minutes),
    }));

    const overlaps = bookedIntervals.some(bookedInterval => 
        isBefore(startTime, bookedInterval.end) && isBefore(bookedInterval.start, endTime)
    );

    if (overlaps) {
      form.setError("duration", { type: "manual", message: "This duration overlaps with another scheduled meeting." });
      return;
    }

    onBook(values.clientId, duration);
  };
  
  const durationOptions = [
    { value: "30", label: "30 minutes" },
    { value: "60", label: "1 hour" },
    { value: "90", label: "1 hour 30 minutes" },
    { value: "120", label: "2 hours" },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Book Slot</DialogTitle>
          <DialogDescription>
            You are booking a slot for{' '}
            <strong>{format(parseISO(slot.date_time), 'PPP p')}</strong>. 
            Please select a client and meeting duration.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="clientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a client" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {clients.length > 0 ? clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      )) : <SelectItem value="no-clients" disabled>No clients found</SelectItem>}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="duration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Duration</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a duration" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {durationOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={isBooking}>
                {isBooking ? 'Booking...' : 'Confirm Booking'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
