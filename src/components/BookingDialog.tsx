
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
import { format, parseISO } from 'date-fns';

interface BookingDialogProps {
  slot: MeetingSlot;
  clients: Client[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onBook: (clientId: string) => void;
  isBooking: boolean;
}

const formSchema = z.object({
  clientId: z.string({
    required_error: "Please select a client.",
  }).min(1, { message: "Please select a client." }),
});

export const BookingDialog = ({ slot, clients, isOpen, onOpenChange, onBook, isBooking }: BookingDialogProps) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    onBook(values.clientId);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Book Slot</DialogTitle>
          <DialogDescription>
            You are booking the slot for{' '}
            <strong>{format(parseISO(slot.date_time), 'PPP p')}</strong>. 
            Please select a client to book this meeting for.
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
