
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Client, ClientOnboardingData } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { Trash } from 'lucide-react';
import { useEffect, useMemo } from 'react';

const onboardingSchema = z.object({
  company_name: z.string().min(1, 'Company name is required.'),
  social_media_links: z.array(z.object({
    platform: z.string().min(1, 'Platform is required'),
    url: z.string().url('Must be a valid URL'),
  })).optional(),
  business_goals: z.string().min(1, 'Business goals are required.'),
  brand_assets_url: z.string().optional(),
  target_audience: z.string().min(1, 'Target audience is required.'),
  competitor_info: z.string().min(1, 'Competitor info is required.'),
});

type OnboardingFormValues = z.infer<typeof onboardingSchema>;

interface OnboardingFormProps {
  client: Client;
  onboardingData: ClientOnboardingData | null;
  onClose: () => void;
}

export const OnboardingForm = ({ client, onboardingData, onClose }: OnboardingFormProps) => {
  const queryClient = useQueryClient();

  const form = useForm<OnboardingFormValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      company_name: onboardingData?.company_name || client.business_name || '',
      social_media_links: onboardingData?.social_media_links || [{ platform: '', url: '' }],
      business_goals: onboardingData?.business_goals || '',
      target_audience: onboardingData?.target_audience || '',
      competitor_info: onboardingData?.competitor_info || '',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "social_media_links",
  });
  
  const calculateProgress = (data: Partial<OnboardingFormValues>): number => {
    const totalFields = 5;
    let completedFields = 0;
    if (data.company_name) completedFields++;
    if (data.business_goals) completedFields++;
    // brand_assets_url is optional for now
    if (data.target_audience) completedFields++;
    if (data.competitor_info) completedFields++;
    if (data.social_media_links && data.social_media_links.length > 0 && data.social_media_links[0]?.url) completedFields++;
    return (completedFields / totalFields) * 100;
  };

  const watchedValues = form.watch();
  const progress = useMemo(() => calculateProgress(watchedValues), [watchedValues]);

  const upsertMutation = useMutation({
    mutationFn: async (values: OnboardingFormValues) => {
      const progress = calculateProgress(values);
      const dataToUpsert = {
        client_id: client.id,
        company_name: values.company_name,
        social_media_links: values.social_media_links,
        business_goals: values.business_goals,
        target_audience: values.target_audience,
        competitor_info: values.competitor_info,
        progress: progress,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase.from('client_onboarding_data').upsert(
        { ...dataToUpsert, id: onboardingData?.id },
        { onConflict: 'client_id' }
      );
      if (error) throw error;
      
      if (client.onboarding_status !== 'In Progress' && client.onboarding_status !== 'Completed') {
         const { error: clientUpdateError } = await supabase.from('clients').update({ onboarding_status: progress === 100 ? 'Completed' : 'In Progress' }).eq('id', client.id);
         if(clientUpdateError) throw clientUpdateError;
      }
    },
    onSuccess: () => {
      toast.success('Onboarding data saved!');
      queryClient.invalidateQueries({ queryKey: ['onboarding_data', client.id] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      onClose();
    },
    onError: (error: Error) => {
      toast.error(`Failed to save: ${error.message}`);
    },
  });

  const onSubmit = (values: OnboardingFormValues) => {
    upsertMutation.mutate(values);
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-2">
            <h4 className="font-medium">Onboarding Progress</h4>
            <Progress value={progress} className="w-full" />
            <p className="text-sm text-muted-foreground">{Math.round(progress)}% complete</p>
        </div>
        <FormField control={form.control} name="company_name" render={({ field }) => (
          <FormItem>
            <FormLabel>Company Name</FormLabel>
            <FormControl><Input {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="business_goals" render={({ field }) => (
          <FormItem>
            <FormLabel>Business Goals</FormLabel>
            <FormControl><Textarea {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="target_audience" render={({ field }) => (
          <FormItem>
            <FormLabel>Target Audience</FormLabel>
            <FormControl><Textarea {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
         <FormField control={form.control} name="competitor_info" render={({ field }) => (
          <FormItem>
            <FormLabel>Competitor Info</FormLabel>
            <FormControl><Textarea {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <div>
            <FormLabel>Social Media Links</FormLabel>
            <div className="space-y-2 mt-2">
            {fields.map((item, index) => (
                <div key={item.id} className="flex gap-2 items-start">
                    <FormField control={form.control} name={`social_media_links.${index}.platform`} render={({ field }) => (
                        <FormItem className="flex-1">
                            <FormControl><Input placeholder="Platform (e.g. Twitter)" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={form.control} name={`social_media_links.${index}.url`} render={({ field }) => (
                        <FormItem className="flex-1">
                            <FormControl><Input placeholder="URL" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}><Trash className="h-4 w-4" /></Button>
                </div>
            ))}
            </div>
            <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => append({ platform: '', url: '' })}>Add Link</Button>
        </div>
        
        <FormItem>
            <FormLabel>Brand Assets (Logo, etc.)</FormLabel>
            <FormControl><Input type="file" disabled /></FormControl>
            <p className="text-sm text-muted-foreground">File upload functionality coming soon!</p>
        </FormItem>

        <div className="text-right">
            <Button type="submit" disabled={upsertMutation.isPending}>
              {upsertMutation.isPending ? 'Saving...' : 'Save Onboarding Data'}
            </Button>
        </div>
      </form>
    </Form>
  );
};
