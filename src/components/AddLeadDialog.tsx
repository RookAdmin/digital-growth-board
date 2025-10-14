
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
  { id: "ai-agents-automation", label: "AI Agents Automation" },
  { id: "web-app-development", label: "Web/App Development" },
  { id: "social-media-marketing", label: "Social Media Marketing" },
  { id: "branding", label: "Branding" },
  { id: "ui-ux-design", label: "UI/UX Design" },
  { id: "seo", label: "SEO" },
  { id: "domain-name-consultation", label: "Domain Name Consultation" },
  { id: "enterprise-domain-management", label: "Enterprise Domain Management" },
] as const;

const budgetRanges = [
  "$1,000—$5,000",
  "$5,001—$15,000",
  "$15,001—$50,000",
  "$50,001—$100,000",
  "$100,000+"
] as const;

const leadSources = ["Website", "Referral", "LinkedIn", "Ads", "Other"] as const;

const leadFormSchema = z.object({
  first_name: z.string()
    .min(1, "First name is required")
    .max(30, "First name must be at most 30 characters")
    .regex(/^[A-Za-z\s]+$/, "Please use valid characters"),
  last_name: z.string()
    .max(30, "Last name must be at most 30 characters")
    .regex(/^[A-Za-z\s]*$/, "Please use valid characters")
    .optional()
    .or(z.literal("")),
  email: z.string().email("Invalid email address"),
  phone: z.string()
    .regex(/^[\d\s\+\-\(\)]*$/, "Invalid phone number format")
    .optional()
    .or(z.literal("")),
  business_name: z.string().max(100).optional().or(z.literal("")),
  services_interested: z.array(z.string()).optional(),
  budget_range: z.string().optional(),
  lead_source: z.enum(leadSources),
  notes: z.string().optional().or(z.literal("")),
});

type LeadFormValues = z.infer<typeof leadFormSchema>;

const AddLeadForm = ({ setOpen }: { setOpen: (open: boolean) => void }) => {
  const queryClient = useQueryClient();
  const form = useForm<LeadFormValues>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
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
      const fullName = `${newLead.first_name}${newLead.last_name ? ' ' + newLead.last_name : ''}`.trim();
      const leadData = {
        name: fullName,
        first_name: newLead.first_name,
        last_name: newLead.last_name || null,
        email: newLead.email,
        phone: newLead.phone || null,
        business_name: newLead.business_name || null,
        services_interested: newLead.services_interested || [],
        budget_range: newLead.budget_range || null,
        lead_source: newLead.lead_source,
        notes: newLead.notes || null,
        status: 'New'
      };
      
      const { data, error } = await supabase.from("leads").insert(leadData).select().single();
      if (error) {
        if (error.message.includes('duplicate') || error.message.includes('unique')) {
          throw new Error("Unable to add lead, please double check the email");
        }
        throw new Error(error.message);
      }
      
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
      toast.error(error.message);
    },
  });

  function onSubmit(values: LeadFormValues) {
    mutate(values);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto p-1">
        <FormField control={form.control} name="first_name" render={({ field }) => (
          <FormItem>
            <FormLabel className="text-gray-900">First Name *</FormLabel>
            <FormControl>
              <Input 
                placeholder="John" 
                {...field} 
                maxLength={30} 
                className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-500"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="last_name" render={({ field }) => (
          <FormItem>
            <FormLabel className="text-gray-900">Last Name</FormLabel>
            <FormControl>
              <Input 
                placeholder="Doe" 
                {...field} 
                maxLength={30} 
                className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-500"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="email" render={({ field }) => (
          <FormItem>
            <FormLabel className="text-gray-900">Email Address *</FormLabel>
            <FormControl>
              <Input 
                placeholder="john.doe@example.com" 
                {...field} 
                className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-500"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="phone" render={({ field }) => (
          <FormItem>
            <FormLabel className="text-gray-900">Phone Number</FormLabel>
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
            <FormLabel className="text-gray-900">Business Name</FormLabel>
            <FormControl>
              <Input 
                placeholder="Your Company Name" 
                {...field} 
                maxLength={100} 
                className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-500"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="services_interested" render={() => (
          <FormItem>
            <FormLabel className="text-gray-900 font-medium">Services Interested</FormLabel>
            <div className="space-y-3 mt-2">
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
                        className="data-[state=checked]:bg-gray-900 data-[state=checked]:border-gray-900"
                      />
                    </FormControl>
                    <FormLabel className="font-normal text-gray-900 cursor-pointer">{service.label}</FormLabel>
                  </FormItem>
                )} />
              ))}
            </div>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="budget_range" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-900">Monthly Budget</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                    <SelectValue placeholder="Select budget range" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-white border-gray-300">
                  {budgetRanges.map(range => (
                    <SelectItem key={range} value={range} className="text-gray-900 hover:bg-gray-100">
                      {range}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
        <FormField control={form.control} name="lead_source" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-900">Lead Source *</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                    <SelectValue placeholder="Select a source" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-white border-gray-300">
                  {leadSources.map(source => (
                    <SelectItem key={source} value={source} className="text-gray-900 hover:bg-gray-100">
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
              <FormLabel className="text-gray-900">Notes</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Any additional information..." 
                  {...field} 
                  className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-500"
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
            className="bg-primary text-primary-foreground hover:bg-primary/90"
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
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl">
          <PlusCircle className="mr-2" />
          Add New Lead
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg bg-white border border-gray-200 rounded-xl shadow-lg">
        <DialogHeader>
          <DialogTitle className="text-gray-900">Add a New Lead</DialogTitle>
          <DialogDescription className="text-gray-600">
            Fill in the lead's information below. Required fields are marked with an asterisk.
          </DialogDescription>
        </DialogHeader>
        <AddLeadForm setOpen={setOpen} />
      </DialogContent>
    </Dialog>
  );
};
