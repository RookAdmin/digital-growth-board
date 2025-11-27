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
import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { LeadActivityLog } from './LeadActivityLog';
import { PhoneInput } from '@/components/PhoneInput';
import { LeadProposals } from './LeadProposals';

interface LeadDetailsModalProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateLeadStatus: (leadId: string, status: LeadStatus) => void;
}

const noteSchema = z.object({
  note: z.string().min(1, 'Note cannot be empty.'),
});

const services = [
  { id: "web-development", label: "Web Development" },
  { id: "digital-marketing", label: "Digital Marketing" },
  { id: "seo", label: "SEO" },
  { id: "social-media-management", label: "Social Media Management" },
  { id: "content-creation", label: "Content Creation" },
] as const;

const leadSources = ["Website", "Referral", "LinkedIn", "Ads", "Other"] as const;

const leadUpdateSchema = z.object({
  name: z.string().min(2, "Full Name must be at least 2 characters.").max(18, "Full Name must be at most 18 characters."),
  email: z.string().email("Invalid email address."),
  phone: z.string().max(18, "Phone number must be at most 18 characters.").optional(),
  business_name: z.string().max(18, "Business name must be at most 18 characters.").optional(),
  lead_source: z.enum(leadSources).optional(),
  budget_range: z.string().max(18, "Budget range must be at most 18 characters.").optional(),
  services_interested: z.array(z.string()).optional(),
});

type LeadUpdateFormValues = z.infer<typeof leadUpdateSchema>;

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

const updateLead = async ({ leadId, values }: { leadId: string; values: LeadUpdateFormValues }) => {
    const { error } = await supabase.from('leads').update(values).eq('id', leadId);
    if (error) throw new Error(error.message);
};

export const LeadDetailsModal = ({ lead, isOpen, onClose, onUpdateLeadStatus }: LeadDetailsModalProps) => {
    const queryClient = useQueryClient();
    const [isEditing, setIsEditing] = useState(false);
    const [pendingStatus, setPendingStatus] = useState<LeadStatus | null>(null);

    const { data: notes, isLoading: isLoadingNotes } = useQuery({
        queryKey: ['lead_notes', lead?.id],
        queryFn: () => fetchLeadNotes(lead!.id),
        enabled: !!lead,
    });
    
    const addNoteMutation = useMutation({
        mutationFn: addLeadNote,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['lead_notes', lead?.id] });
            queryClient.invalidateQueries({ queryKey: ['lead-status-history', lead?.id] });
            queryClient.invalidateQueries({ queryKey: ['lead-activity-logs', lead?.id] });
            toast.success('Note added successfully');
            noteForm.reset();
        },
        onError: (error: Error) => {
            toast.error(`Failed to add note: ${error.message}`);
        },
    });
    
    const updateLeadMutation = useMutation({
        mutationFn: updateLead,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['leads'] });
            queryClient.invalidateQueries({ queryKey: ['leads-with-history'] });
            queryClient.invalidateQueries({ queryKey: ['lead-status-history', lead?.id] });
            queryClient.invalidateQueries({ queryKey: ['lead-activity-logs', lead?.id] });
            toast.success('Lead details updated successfully');
            setIsEditing(false);
        },
        onError: (error: Error) => {
            toast.error(`Failed to update lead: ${error.message}`);
        },
    });
    
    const noteForm = useForm({
        resolver: zodResolver(noteSchema),
        defaultValues: { note: '' },
    });

    const leadForm = useForm<LeadUpdateFormValues>({
        resolver: zodResolver(leadUpdateSchema),
    });

    useEffect(() => {
        if (lead) {
            leadForm.reset({
                name: lead.name,
                email: lead.email,
                phone: lead.phone || '',
                business_name: lead.business_name || '',
                lead_source: lead.lead_source as any,
                budget_range: lead.budget_range || '',
                services_interested: lead.services_interested || [],
            });
            setPendingStatus(null);
        }
    }, [lead, leadForm, isOpen]);

    const onSubmitNote = (values: z.infer<typeof noteSchema>) => {
        if (!lead) return;
        addNoteMutation.mutate({ leadId: lead.id, note: values.note });
    };

    const onUpdateLead = (values: LeadUpdateFormValues) => {
        if (!lead) return;
        updateLeadMutation.mutate({ leadId: lead.id, values });
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        if (lead) {
             leadForm.reset({
                name: lead.name,
                email: lead.email,
                phone: lead.phone || '',
                business_name: lead.business_name || '',
                lead_source: lead.lead_source as any,
                budget_range: lead.budget_range || '',
                services_interested: lead.services_interested || [],
            });
        }
    };

    const handleStatusChange = (newStatus: LeadStatus) => {
        setPendingStatus(newStatus);
    };

    const handleSaveStatus = () => {
        if (pendingStatus && lead) {
            onUpdateLeadStatus(lead.id, pendingStatus);
            setPendingStatus(null);
            toast.success('Status updated successfully');
        }
    };

    const handleCancelStatus = () => {
        setPendingStatus(null);
    };

    if (!lead) return null;
    
    const statusOptions: LeadStatus[] = ["New", "Contacted", "Qualified", "Proposal Sent", "Converted", "Dropped"];
    const currentDisplayStatus = pendingStatus || lead.status;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => { if(!open) { noteForm.reset(); onClose(); setIsEditing(false); setPendingStatus(null); }}}>
            <DialogContent className="max-w-6xl h-[90vh] flex flex-col bg-white">
                <DialogHeader className="bg-white">
                    <div className="flex justify-between items-start">
                        {isEditing ? (
                            <Form {...leadForm}>
                                <div className="space-y-2 flex-grow pr-12">
                                    <FormField control={leadForm.control} name="name" render={({ field }) => (
                                        <FormItem>
                                            <FormControl><Input {...field} className="text-2xl font-bold h-auto p-2 border border-input rounded-md shadow-sm focus-visible:ring-2 focus-visible:ring-ring bg-white" maxLength={18} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                     <FormField control={leadForm.control} name="business_name" render={({ field }) => (
                                        <FormItem>
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <Briefcase size={14} />
                                                <FormControl><Input {...field} placeholder="Business Name" className="text-sm h-auto p-2 border border-input rounded-md shadow-sm focus-visible:ring-2 focus-visible:ring-ring bg-white" maxLength={18} /></FormControl>
                                            </div>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                </div>
                            </Form>
                        ) : (
                            <div>
                                <DialogTitle className="text-2xl break-words">{lead.name}</DialogTitle>
                                {lead.business_name && (
                                <DialogDescription>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                        <Briefcase size={14} /> <span className="break-words">{lead.business_name}</span>
                                    </div>
                                </DialogDescription>
                                )}
                            </div>
                        )}
                        {!isEditing ? (
                            <Button variant="outline" size="icon" onClick={() => setIsEditing(true)} className="h-8 w-8">
                                <Edit size={14} />
                            </Button>
                        ) : null}
                    </div>
                </DialogHeader>
                <div className="grid md:grid-cols-4 gap-6 mt-4 flex-1 overflow-hidden bg-white">
                    <ScrollArea className="pr-4 bg-white">
                        <h3 className="font-semibold mb-4 text-lg">Lead Information</h3>
                        {isEditing ? (
                            <Form {...leadForm}>
                                <form id="lead-update-form" onSubmit={leadForm.handleSubmit(onUpdateLead)} className="space-y-4 text-sm">
                                    <FormField control={leadForm.control} name="email" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="flex items-center gap-3"><Mail size={16} className="text-muted-foreground" /> Email</FormLabel>
                                            <FormControl><Input {...field} className="bg-white" /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <FormField control={leadForm.control} name="phone" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="flex items-center gap-3"><Phone size={16} className="text-muted-foreground" /> Phone</FormLabel>
                                            <FormControl>
                                              <PhoneInput 
                                                value={field.value} 
                                                onChange={field.onChange}
                                                placeholder="Enter phone number"
                                              />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                     <FormField control={leadForm.control} name="lead_source" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="flex items-center gap-3"><Edit size={16} className="text-muted-foreground" /> Lead Source</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="bg-white"><SelectValue placeholder="Select a source" /></SelectTrigger>
                                                </FormControl>
                                                <SelectContent className="bg-white">
                                                    {leadSources.map(source => <SelectItem key={source} value={source}>{source}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <FormField control={leadForm.control} name="budget_range" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="flex items-center gap-3"><DollarSign size={16} className="text-muted-foreground" /> Budget</FormLabel>
                                            <FormControl><Input {...field} maxLength={18} className="bg-white" /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                     <FormField control={leadForm.control} name="services_interested" render={() => (
                                        <FormItem>
                                            <FormLabel className="flex items-start gap-3"><List size={16} className="text-muted-foreground" /> Services</FormLabel>
                                            {services.map((service) => (
                                                <FormField key={service.id} control={leadForm.control} name="services_interested" render={({ field }) => (
                                                    <FormItem key={service.id} className="flex flex-row items-start space-x-3 space-y-0 ml-7">
                                                    <FormControl>
                                                        <Checkbox
                                                        checked={field.value?.includes(service.label)}
                                                        onCheckedChange={(checked) => {
                                                            const currentValue = field.value || [];
                                                            return checked
                                                            ? field.onChange([...currentValue, service.label])
                                                            : field.onChange(currentValue.filter(value => value !== service.label));
                                                        }}
                                                        />
                                                    </FormControl>
                                                    <FormLabel className="font-normal">{service.label}</FormLabel>
                                                    </FormItem>
                                                )} />
                                            ))}
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                </form>
                            </Form>
                        ) : (
                            <div className="space-y-4 text-sm">
                               <div className="flex items-center gap-3"><Mail size={16} className="text-muted-foreground" /> <span className="break-words">{lead.email}</span></div>
                               {lead.phone && <div className="flex items-center gap-3"><Phone size={16} className="text-muted-foreground" /> <span className="break-words">{lead.phone}</span></div>}
                               {lead.created_at && <div className="flex items-center gap-3"><Calendar size={16} className="text-muted-foreground" /> <span>Added on {format(new Date(lead.created_at), 'MMM d, yyyy')}</span></div>}
                               {lead.lead_source && <div className="flex items-center gap-3"><Edit size={16} className="text-muted-foreground" /> <span>Source: {lead.lead_source}</span></div>}
                               {lead.budget_range && <div className="flex items-center gap-3"><DollarSign size={16} className="text-muted-foreground" /> <span className="break-words">Budget: {lead.budget_range}</span></div>}
                               {lead.services_interested && lead.services_interested.length > 0 && <div className="flex items-start gap-3"><List size={16} className="text-muted-foreground mt-1" /> <div className="break-words">Services: {lead.services_interested.join(', ')}</div></div>}
                               {lead.notes && <div className="flex items-start gap-3"><Edit size={16} className="text-muted-foreground mt-1" /> <div className="break-words">Initial Notes: {lead.notes}</div></div>}
                            </div>
                        )}

                        <h3 className="font-semibold mb-4 mt-6 text-lg">Change Status</h3>
                         <Select
                            value={currentDisplayStatus}
                            onValueChange={handleStatusChange}
                        >
                            <SelectTrigger className="bg-white">
                                <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent className="bg-white">
                                {statusOptions.map(status => (
                                    <SelectItem key={status} value={status}>{status}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {pendingStatus && pendingStatus !== lead.status && (
                            <div className="flex gap-2 mt-4">
                                <Button onClick={handleSaveStatus} size="sm" className="bg-[#131313] hover:bg-[#222222]">
                                    Save Status
                                </Button>
                                <Button onClick={handleCancelStatus} variant="outline" size="sm">
                                    Cancel
                                </Button>
                            </div>
                        )}

                        {isEditing && (
                            <div className="flex justify-end gap-2 mt-6">
                                <Button type="button" variant="ghost" onClick={handleCancelEdit}>Cancel</Button>
                                <Button type="submit" form="lead-update-form" disabled={updateLeadMutation.isPending}>
                                    {updateLeadMutation.isPending ? 'Saving...' : 'Save Changes'}
                                </Button>
                            </div>
                        )}
                    </ScrollArea>
                    <div className="h-full overflow-hidden bg-white">
                        <LeadActivityLog leadId={lead.id} />
                    </div>
                    
                    <div className="h-full overflow-hidden bg-white">
                        <LeadProposals leadId={lead.id} clientId={lead.client_id ?? null} />
                    </div>
                    
                    <div className="flex flex-col h-full overflow-hidden bg-white">
                        <h3 className="font-semibold mb-4 text-lg shrink-0">Follow-up Notes</h3>
                        <Form {...noteForm}>
                            <form onSubmit={noteForm.handleSubmit(onSubmitNote)} className="space-y-4 shrink-0">
                                <FormField
                                    control={noteForm.control}
                                    name="note"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>New Note</FormLabel>
                                            <FormControl>
                                                <Textarea placeholder="Add a new note..." {...field} className="bg-white" />
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
                                    <div key={note.id} className="p-3 bg-gray-50 rounded-lg border">
                                        <p className="text-sm whitespace-pre-wrap break-words">{note.note}</p>
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
