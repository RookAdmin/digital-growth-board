import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, Upload, X as XIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Task } from '@/types';

const invoiceSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters." }),
  description: z.string().max(300, { message: "Description must be under 300 characters." }).optional(),
  amount: z.number().min(1, { message: "Amount must be at least 1." }),
  currency: z.string().min(1),
  issued_date: z.date(),
  due_date: z.date(),
  status: z.enum(["Draft", "Sent", "Paid", "Overdue"]).default("Draft"),
  payment_terms: z.string().max(60).optional(),
  notes: z.string().max(200).optional(),
  milestoneId: z.string().optional(),
});

type InvoiceFormValues = z.infer<typeof invoiceSchema>;

interface AddInvoiceFormProps {
  projectId: string;
  clientId: string;
  milestones: Task[];
  onCancel: () => void;
}

const currencyOptions = ["USD", "EUR", "GBP", "INR", "AUD"];

export const AddInvoiceForm = ({ projectId, clientId, milestones, onCancel }: AddInvoiceFormProps) => {
  const queryClient = useQueryClient();
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const availableMilestones = milestones.filter((milestone) => !milestone.invoice_id);

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      title: "",
      description: "",
      amount: 0,
      currency: "USD",
      issued_date: new Date(),
      due_date: new Date(),
      status: "Draft",
      payment_terms: "Net 30",
      notes: "",
      milestoneId: undefined,
    },
  });

  const addInvoiceMutation = useMutation({
    mutationFn: async (values: InvoiceFormValues) => {
      let invoiceNumber: string | null = null;

      try {
        const { data, error } = await supabase.rpc('generate_invoice_number');
        if (error) {
          console.warn('generate_invoice_number RPC failed, falling back to timestamp', error);
        } else {
          invoiceNumber = data;
        }
      } catch (error) {
        console.warn('generate_invoice_number RPC threw an error, falling back to timestamp', error);
      }

      if (!invoiceNumber) {
        invoiceNumber = `INV-${Date.now()}`;
      }

      let pdfUrl: string | null = null;

      if (invoiceFile) {
        const fileExt = invoiceFile.name.split('.').pop();
        const filePath = `invoices/${projectId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('project-files')
          .upload(filePath, invoiceFile, {
            cacheControl: '3600',
            upsert: false,
            contentType: invoiceFile.type,
          });

        if (uploadError) {
          throw uploadError;
        }

        const { data: publicData } = supabase.storage
          .from('project-files')
          .getPublicUrl(filePath);

        pdfUrl = publicData.publicUrl;
      }

      const payload = {
        project_id: projectId,
        client_id: clientId,
        title: values.title,
        description: values.description || null,
        amount: values.amount,
        total_amount: values.amount,
        tax_amount: 0,
        currency: values.currency,
        status: values.status,
        invoice_number: invoiceNumber,
        issued_date: values.issued_date.toISOString(),
        due_date: values.due_date.toISOString(),
        payment_terms: values.payment_terms || null,
        notes: values.notes || null,
        pdf_url: pdfUrl,
      };

      const { data: insertedInvoice, error } = await supabase
        .from('invoices')
        .insert(payload)
        .select()
        .single();

      if (error) {
        throw error;
      }

      if (values.milestoneId && insertedInvoice) {
        const { error: linkError } = await supabase
          .from('tasks')
          .update({ invoice_id: insertedInvoice.id })
          .eq('id', values.milestoneId);

        if (linkError) {
          throw linkError;
        }
      }
    },
    onSuccess: () => {
      toast.success("Invoice created successfully.");
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
      form.reset({
        title: "",
        description: "",
        amount: 0,
        currency: "USD",
        issued_date: new Date(),
        due_date: new Date(),
        status: "Draft",
        payment_terms: "Net 30",
        notes: "",
        milestoneId: undefined,
      });
      setInvoiceFile(null);
      setFileError(null);
      onCancel();
    },
    onError: (error: any) => {
      console.error('Failed to create invoice', error);
      toast.error("Failed to create invoice.");
    },
  });

  const onSubmit = (values: InvoiceFormValues) => {
    addInvoiceMutation.mutate(values);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setInvoiceFile(null);
      return;
    }

    if (file.type !== 'application/pdf') {
      setFileError('Please upload a PDF file.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setFileError('File size must be under 10MB.');
      return;
    }

    setInvoiceFile(file);
    setFileError(null);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-4 border border-gray-200 rounded-xl bg-white">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Invoice Title</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Milestone 1 Billing" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Amount</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    {...field}
                    value={field.value ?? ''}
                    onChange={(event) => field.onChange(Number(event.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="milestoneId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Link to Milestone (optional)</FormLabel>
              <Select
                onValueChange={(value) => field.onChange(value === 'none' ? undefined : value)}
                value={field.value ?? 'none'}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select milestone to link" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="none">Do not link</SelectItem>
                  {availableMilestones.length === 0 ? (
                    <SelectItem value="none-disabled" disabled>
                      All milestones already linked
                    </SelectItem>
                  ) : (
                    availableMilestones.map((milestone) => (
                      <SelectItem key={milestone.id} value={milestone.id}>
                        {milestone.title}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-2">
          <FormLabel>Invoice PDF (optional)</FormLabel>
          <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700 font-medium">
            <Upload className="h-4 w-4" />
            <span>{invoiceFile ? invoiceFile.name : 'Upload PDF'}</span>
            <input
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={handleFileChange}
            />
            {invoiceFile && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setInvoiceFile(null)}
              >
                <XIcon className="h-4 w-4" />
              </Button>
            )}
          </label>
        <p className="text-xs text-muted-foreground">PDF files up to 10MB.</p>
        {fileError && (
          <p className="text-xs text-red-500">{fileError}</p>
        )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="currency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Currency</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {currencyOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {["Draft", "Sent", "Paid", "Overdue"].map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="issued_date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Issued Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-gray-500"
                        )}
                      >
                        {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="due_date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Due Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-gray-500"
                        )}
                      >
                        {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (optional)</FormLabel>
              <FormControl>
                <Textarea rows={3} placeholder="Add details about this invoice..." {...field} value={field.value || ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="payment_terms"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Payment Terms</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Net 30" {...field} value={field.value || ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notes</FormLabel>
                <FormControl>
                  <Input placeholder="Optional notes" {...field} value={field.value || ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={addInvoiceMutation.isPending || !!fileError}>
            {addInvoiceMutation.isPending ? 'Creating Invoice...' : 'Create Invoice'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

