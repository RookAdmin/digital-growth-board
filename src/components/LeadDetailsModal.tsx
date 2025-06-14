
import { Lead, LeadNote, LeadStatus } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Briefcase, Mail, Phone, Calendar, DollarSign, List, Edit } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface LeadDetailsModalProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateLeadStatus: (leadId: string, status: LeadStatus) => void;
}

const noteSchema = z.object({
  note: z.string().min(1, 'Note cannot be empty.'),
});

const fetchLeadNotes = async (leadId: string): Promise<LeadNote[]> => {
    if (!leadId) return [];
    const { data, error } = await supabase.from('lead_notes').select('*').eq('lead_id', leadId).order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data;
};

const addLeadNote = async ({ leadId, note }: { leadId: string; note: string }) => {
    const { error } = await supabase.from('lead_notes').insert({ lead_id: leadId, note });
    if (error) throw new Error(error.message);
};

export const LeadDetailsModal = ({ lead, isOpen, onClose, onUpdateLeadStatus }: LeadDetailsModalProps) => {
    const queryClient = useQueryClient();

    const { data: notes, isLoading: isLoadingNotes } = useQuery({
        queryKey: ['lead_notes', lead?.id],
        queryFn: () => fetchLeadNotes(lead!.id),
        enabled: !!lead,
    });
    
    const addNoteMutation = useMutation({
        mutationFn: addLeadNote,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['lead_notes', lead?.id] });
            toast.success('Note added successfully');
            form.reset();
        },
        onError: (error: Error) => {
            toast.error(`Failed to add note: ${error.message}`);
        },
    });
    
    const form = useForm({
        resolver: zodResolver(noteSchema),
        defaultValues: { note: '' },
    });

    const onSubmitNote = (values: z.infer<typeof noteSchema>) => {
        if (!lead) return;
        addNoteMutation.mutate({ leadId: lead.id, note: values.note });
    };

    if (!lead) return null;
    
    const statusOptions: LeadStatus[] = ["New", "Contacted", "Qualified", "Proposal Sent", "Converted", "Dropped"];

    return (
        <Dialog open={isOpen} onOpenChange={(open) => { if(!open) { form.reset(); onClose(); }}}>
            <DialogContent className="max-w-3xl h-[90vh]">
                <DialogHeader>
                    <DialogTitle className="text-2xl">{lead.name}</DialogTitle>
                    <DialogDescription>
                        {lead.business_name && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                <Briefcase size={14} /> <span>{lead.business_name}</span>
                            </div>
                        )}
                    </DialogDescription>
                </DialogHeader>
                <div className="grid md:grid-cols-2 gap-6 mt-4 overflow-hidden h-full">
                    <ScrollArea className="pr-4">
                        <h3 className="font-semibold mb-4 text-lg">Lead Information</h3>
                        <div className="space-y-4 text-sm">
                           <div className="flex items-center gap-3"><Mail size={16} className="text-muted-foreground" /> <span>{lead.email}</span></div>
                           {lead.phone && <div className="flex items-center gap-3"><Phone size={16} className="text-muted-foreground" /> <span>{lead.phone}</span></div>}
                           {lead.created_at && <div className="flex items-center gap-3"><Calendar size={16} className="text-muted-foreground" /> <span>Added on {format(new Date(lead.created_at), 'MMM d, yyyy')}</span></div>}
                           {lead.lead_source && <div className="flex items-center gap-3"><Edit size={16} className="text-muted-foreground" /> <span>Source: {lead.lead_source}</span></div>}
                           {lead.budget_range && <div className="flex items-center gap-3"><DollarSign size={16} className="text-muted-foreground" /> <span>Budget: {lead.budget_range}</span></div>}
                           {lead.services_interested && <div className="flex items-start gap-3"><List size={16} className="text-muted-foreground mt-1" /> <div>Services: {lead.services_interested.join(', ')}</div></div>}
                        </div>

                        <h3 className="font-semibold mb-4 mt-6 text-lg">Change Status</h3>
                         <Select
                            defaultValue={lead.status}
                            onValueChange={(value) => onUpdateLeadStatus(lead.id, value as LeadStatus)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                                {statusOptions.map(status => (
                                    <SelectItem key={status} value={status}>{status}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </ScrollArea>
                    <div className="flex flex-col h-full overflow-hidden">
                        <h3 className="font-semibold mb-4 text-lg shrink-0">Follow-up Notes</h3>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmitNote)} className="space-y-4 shrink-0">
                                <FormField
                                    control={form.control}
                                    name="note"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>New Note</FormLabel>
                                            <FormControl>
                                                <Textarea placeholder="Add a new note..." {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <Button type="submit" disabled={addNoteMutation.isPending}>
                                    {addNoteMutation.isPending ? 'Adding...' : 'Add Note'}
                                </Button>
                            </form>
                        </Form>
                        <ScrollArea className="flex-grow mt-4 -mr-4 pr-4">
                            <div className="space-y-4">
                                {isLoadingNotes && <p>Loading notes...</p>}
                                {notes?.map(note => (
                                    <div key={note.id} className="p-3 bg-secondary rounded-lg">
                                        <p className="text-sm whitespace-pre-wrap">{note.note}</p>
                                        <p className="text-xs text-muted-foreground mt-2">{format(new Date(note.created_at), 'MMM d, yyyy h:mm a')}</p>
                                    </div>
                                ))}
                                {!isLoadingNotes && notes?.length === 0 && <p className="text-sm text-muted-foreground">No notes yet.</p>}
                            </div>
                        </ScrollArea>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
