
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { PlusCircle } from "lucide-react";
import { PhoneInput } from "@/components/PhoneInput";

const services = [
  { id: "web-development", label: "Web Development" },
  { id: "digital-marketing", label: "Digital Marketing" },
  { id: "seo", label: "SEO" },
  { id: "social-media-management", label: "Social Media Management" },
  { id: "content-creation", label: "Content Creation" },
] as const;

const leadSources = ["Website", "Referral", "LinkedIn", "Ads", "Other"] as const;

const leadFormSchema = z.object({
  name: z.string().min(2, "Full Name must be at least 2 characters.").max(18, "Full Name must be at most 18 characters."),
  email: z.string().email("Invalid email address."),
  phone: z.string().max(18, "Phone number must be at most 18 characters.").optional(),
  business_name: z.string().max(18, "Business name must be at most 18 characters.").optional(),
  services_interested: z.array(z.string()).optional(),
  budget_range: z.string().max(18, "Budget range must be at most 18 characters.").optional(),
  lead_source: z.enum(leadSources).optional(),
  notes: z.string().optional(),
});

type LeadFormValues = z.infer<typeof leadFormSchema>;

const AddLeadForm = ({ setOpen }: { setOpen: (open: boolean) => void }) => {
  const queryClient = useQueryClient();
  const form = useForm<LeadFormValues>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      business_name: "",
      services_interested: [],
      budget_range: "",
      notes: "",
    },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: async (newLead: LeadFormValues) => {
      const leadData = {
        name: newLead.name,
        email: newLead.email,
        phone: newLead.phone || null,
        business_name: newLead.business_name || null,
        services_interested: newLead.services_interested || [],
        budget_range: newLead.budget_range || null,
        lead_source: newLead.lead_source || null,
        notes: newLead.notes || null,
        status: 'New'
      };
      
      const { data, error } = await supabase.from("leads").insert(leadData).select().single();
      if (error) throw new Error(error.message);
      
      // Record initial status in history
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('lead_status_history').insert({
        lead_id: data.id,
        old_status: null,
        new_status: 'New',
        changed_by: user?.id
      });
      
      return data;
    },
    onSuccess: () => {
      toast.success("Lead added successfully!");
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      setOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast.error(`Failed to add lead: ${error.message}`);
    },
  });

  function onSubmit(values: LeadFormValues) {
    mutate(values);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto p-1">
        <FormField control={form.control} name="name" render={({ field }) => (
          <FormItem>
            <FormLabel className="text-black">Full Name *</FormLabel>
            <FormControl>
              <Input 
                placeholder="John Doe" 
                {...field} 
                maxLength={18} 
                className="bg-white border-gray-300 text-black placeholder:text-gray-500"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="email" render={({ field }) => (
          <FormItem>
            <FormLabel className="text-black">Email ID *</FormLabel>
            <FormControl>
              <Input 
                placeholder="john.doe@example.com" 
                {...field} 
                className="bg-white border-gray-300 text-black placeholder:text-gray-500"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="phone" render={({ field }) => (
          <FormItem>
            <FormLabel className="text-black">Phone Number</FormLabel>
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
        <FormField control={form.control} name="business_name" render={({ field }) => (
          <FormItem>
            <FormLabel className="text-black">Business Name</FormLabel>
            <FormControl>
              <Input 
                placeholder="Doe's Digital" 
                {...field} 
                maxLength={18} 
                className="bg-white border-gray-300 text-black placeholder:text-gray-500"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="services_interested" render={() => (
          <FormItem>
            <FormLabel className="text-black">Services Interested</FormLabel>
            {services.map((service) => (
              <FormField key={service.id} control={form.control} name="services_interested" render={({ field }) => (
                <FormItem key={service.id} className="flex flex-row items-start space-x-3 space-y-0">
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
                  <FormLabel className="font-normal text-black">{service.label}</FormLabel>
                </FormItem>
              )} />
            ))}
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="budget_range" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-black">Budget Range</FormLabel>
              <FormControl>
                <Input 
                  placeholder="$5,000 - $10,000" 
                  {...field} 
                  maxLength={18} 
                  className="bg-white border-gray-300 text-black placeholder:text-gray-500"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
        <FormField control={form.control} name="lead_source" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-black">Lead Source</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="bg-white border-gray-300 text-black">
                    <SelectValue placeholder="Select a source" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-white border-gray-300">
                  {leadSources.map(source => (
                    <SelectItem key={source} value={source} className="text-black hover:bg-gray-100">
                      {source}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
        <FormField control={form.control} name="notes" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-black">Notes</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Any additional information..." 
                  {...field} 
                  className="bg-white border-gray-300 text-black placeholder:text-gray-500"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
        <DialogFooter className="pt-4">
          <Button 
            type="button" 
            variant="ghost" 
            onClick={() => setOpen(false)}
            className="text-gray-700 hover:bg-gray-100 hover:text-gray-900"
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={isPending}
            className="bg-gray-900 text-white hover:bg-gray-800 hover:text-white"
          >
            {isPending ? "Adding Lead..." : "Add Lead"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
};

export const AddLeadDialog = () => {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gray-900 text-white hover:bg-gray-800 hover:text-white rounded-xl">
          <PlusCircle className="mr-2" />
          Add New Lead
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg bg-white border border-gray-200 rounded-xl shadow-lg">
        <DialogHeader>
          <DialogTitle className="text-black">Add a New Lead</DialogTitle>
          <DialogDescription className="text-gray-600">
            Fill in the lead's information below. Required fields are marked with an asterisk.
          </DialogDescription>
        </DialogHeader>
        <AddLeadForm setOpen={setOpen} />
      </DialogContent>
    </Dialog>
  );
};
