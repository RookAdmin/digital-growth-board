
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { PhoneInput } from "@/components/PhoneInput";
import { Header } from "@/components/Header";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const services = [
  { id: "web-development", label: "Web Development" },
  { id: "digital-marketing", label: "Digital Marketing" },
  { id: "seo", label: "SEO" },
  { id: "social-media-management", label: "Social Media Management" },
  { id: "content-creation", label: "Content Creation" },
] as const;

const leadSources = ["Website", "Referral", "LinkedIn", "Ads", "Other"] as const;

const registerFormSchema = z.object({
  name: z.string().min(2, "Full Name must be at least 2 characters.").max(50, "Full Name must be at most 50 characters."),
  email: z.string().email("Invalid email address."),
  phone: z.string().optional(),
  business_name: z.string().max(50, "Business name must be at most 50 characters.").optional(),
  services_interested: z.array(z.string()).optional(),
  budget_range: z.string().max(50, "Budget range must be at most 50 characters.").optional(),
  lead_source: z.enum(leadSources).optional(),
  notes: z.string().optional(),
});

type RegisterFormValues = z.infer<typeof registerFormSchema>;

const RegisterPage = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      business_name: "",
      services_interested: [],
      budget_range: "",
      lead_source: "Website",
      notes: "",
    },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: async (newLead: RegisterFormValues) => {
      const leadData = {
        name: newLead.name,
        email: newLead.email,
        phone: newLead.phone || null,
        business_name: newLead.business_name || null,
        services_interested: newLead.services_interested || [],
        budget_range: newLead.budget_range || null,
        lead_source: newLead.lead_source || "Website",
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
      toast.success("Thank you for your interest! We'll be in touch soon.");
      form.reset();
      // Redirect to home page after successful submission
      navigate('/');
    },
    onError: (error) => {
      toast.error(`Failed to submit registration: ${error.message}`);
    },
  });

  function onSubmit(values: RegisterFormValues) {
    setIsSubmitting(true);
    mutate(values);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onLightBg />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Start Your Project</h1>
            <p className="text-gray-600">Tell us about your project and we'll get back to you with a custom proposal.</p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name *</FormLabel>
                    <FormControl><Input placeholder="John Doe" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address *</FormLabel>
                    <FormControl><Input placeholder="john.doe@example.com" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="phone" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
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
                    <FormLabel>Business Name</FormLabel>
                    <FormControl><Input placeholder="Your Company Name" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="services_interested" render={() => (
                  <FormItem>
                    <FormLabel>Services You're Interested In</FormLabel>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                            <FormLabel className="font-normal">{service.label}</FormLabel>
                          </FormItem>
                        )} />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="budget_range" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estimated Budget Range</FormLabel>
                    <FormControl><Input placeholder="e.g., $5,000 - $10,000" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="lead_source" render={({ field }) => (
                  <FormItem>
                    <FormLabel>How did you hear about us?</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Select a source" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {leadSources.map(source => <SelectItem key={source} value={source}>{source}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="notes" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Details</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Tell us more about your project, goals, timeline, or any specific requirements..."
                        className="min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <div className="pt-4">
                  <Button 
                    type="submit" 
                    disabled={isPending || isSubmitting}
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-3 text-lg"
                  >
                    {isPending || isSubmitting ? "Submitting..." : "Submit Project Request"}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
