import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Proposal } from '@/types';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2, FileText, ExternalLink, Upload, X } from 'lucide-react';
import { format } from 'date-fns';

const proposalSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters').max(80, 'Keep the title under 80 characters'),
  word_doc_link: z.string().url('Please provide a valid URL').optional().or(z.literal('')),
});

type ProposalFormValues = z.infer<typeof proposalSchema>;

interface LeadProposalsProps {
  leadId: string;
  clientId?: string | null;
}

export const LeadProposals = ({ leadId, clientId }: LeadProposalsProps) => {
  const queryClient = useQueryClient();
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const { data: proposals = [], isLoading } = useQuery({
    queryKey: ['lead-proposals', leadId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('proposals')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      return data as Proposal[];
    },
    enabled: !!leadId,
  });

  const form = useForm<ProposalFormValues>({
    resolver: zodResolver(proposalSchema),
    defaultValues: {
      title: '',
      word_doc_link: '',
    },
  });

  const addProposalMutation = useMutation({
    mutationFn: async (values: ProposalFormValues) => {
      let pdfUrl: string | null = null;

      if (pdfFile) {
        const fileExt = pdfFile.name.split('.').pop();
        const filePath = `lead-proposals/${leadId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('proposals')
          .upload(filePath, pdfFile, {
            cacheControl: '3600',
            upsert: false,
            contentType: pdfFile.type,
          });

        if (uploadError) {
          throw uploadError;
        }

        const { data: publicData } = supabase.storage.from('proposals').getPublicUrl(filePath);
        pdfUrl = publicData.publicUrl;
      }

      const payload = {
        lead_id: leadId,
        client_id: clientId || null,
        title: values.title.trim(),
        status: 'Draft',
        total_amount: 0,
        word_doc_link: values.word_doc_link?.trim() || null,
        proposal_pdf_url: pdfUrl,
      };

      const { error } = await supabase.from('proposals').insert(payload);
      if (error) {
          throw new Error(error.message);
      }
    },
    onSuccess: () => {
      toast.success('Proposal saved');
      queryClient.invalidateQueries({ queryKey: ['lead-proposals', leadId] });
      form.reset();
      setPdfFile(null);
      setFileError(null);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setPdfFile(null);
      setFileError(null);
      return;
    }

    if (file.type !== 'application/pdf') {
      setFileError('Please upload a PDF file.');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setFileError('File size must be under 15MB.');
      return;
    }

    setPdfFile(file);
    setFileError(null);
  };

  const onSubmit = (values: ProposalFormValues) => {
    addProposalMutation.mutate(values);
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Proposals</h3>
        {isLoading && <Loader2 className="h-4 w-4 animate-spin text-gray-500" />}
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Proposal Title</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="e.g., Q4 Growth Sprint" className="bg-white" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="word_doc_link"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Word Document Link</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="https://..." className="bg-white" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="space-y-2">
            <FormLabel>Attach PDF (optional)</FormLabel>
            <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700 font-medium">
              <Upload className="h-4 w-4" />
              <span>{pdfFile ? pdfFile.name : 'Upload PDF'}</span>
              <input type="file" accept="application/pdf" className="hidden" onChange={handleFileChange} />
              {pdfFile && (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setPdfFile(null);
                    setFileError(null);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </label>
            <p className="text-xs text-muted-foreground">PDF files up to 15MB.</p>
            {fileError && <p className="text-xs text-red-500">{fileError}</p>}
          </div>

          <Button type="submit" className="w-full" disabled={addProposalMutation.isPending || !!fileError}>
            {addProposalMutation.isPending ? 'Saving...' : 'Save Proposal'}
          </Button>
        </form>
      </Form>

      <div className="mt-6 space-y-3 max-h-64 overflow-y-auto pr-2">
        {proposals.length === 0 ? (
          <p className="text-sm text-gray-500">No proposals yet. Capture your first offer above.</p>
        ) : (
          proposals.map((proposal) => (
            <div key={proposal.id} className="rounded-xl border border-gray-100 bg-white p-3 space-y-2">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-gray-900">{proposal.title}</p>
                  <p className="text-xs text-gray-500">
                    Added {format(new Date(proposal.created_at), 'MMM d, yyyy')}
                  </p>
                </div>
                <Badge variant="secondary" className="capitalize">
                  {proposal.status}
                </Badge>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600">
                {proposal.word_doc_link && (
                  <a
                    href={proposal.word_doc_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Word link
                  </a>
                )}
                {proposal.proposal_pdf_url && (
                  <a
                    href={proposal.proposal_pdf_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                  >
                    <FileText className="h-3 w-3" />
                    View PDF
                  </a>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

