
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
import { ArrowLeft, CheckCircle, Star, Users, Zap } from "lucide-react";
import { useEffect } from "react";

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

const leadSources = ["Website", "Referral", "LinkedIn", "Google Ads", "Social Media", "Other"] as const;

const registerFormSchema = z.object({
  firstName: z.string()
    .min(1, "First name is required")
    .max(30, "First name must be at most 30 characters")
    .regex(/^[A-Za-z\s]+$/, "Please use valid characters"),
  lastName: z.string()
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
  lead_source: z.enum(leadSources).optional(),
  notes: z.string().optional().or(z.literal("")),
});

type RegisterFormValues = z.infer<typeof registerFormSchema>;

const RegisterPage = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      business_name: "",
      services_interested: [],
      budget_range: "",
      lead_source: "Website",
      notes: "",
    },
  });

  useEffect(() => {
    document.title = "Register - Rook";
  }, []);

  const { mutate, isPending } = useMutation({
    mutationFn: async (newLead: RegisterFormValues) => {
      const leadData = {
        first_name: newLead.firstName,
        last_name: newLead.lastName || null,
        name: `${newLead.firstName}${newLead.lastName ? ' ' + newLead.lastName : ''}`.trim(),
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
      if (error) {
        if (error.message.includes('duplicate') || error.message.includes('unique')) {
          throw new Error("Unable to register, please double check your email");
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
      toast.success("Thank you for your interest! We'll be in touch soon.");
      form.reset();
      navigate('/');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  function onSubmit(values: RegisterFormValues) {
    setIsSubmitting(true);
    mutate(values);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onLightBg />

      <div className="container mx-auto px-4 py-12 lg:py-20">
        <div className="grid lg:grid-cols-[1.05fr_1fr] gap-10 lg:gap-16">
          {/* Overview */}
          <div className="space-y-8">
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              className="text-gray-700 hover:text-gray-500 px-0"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to home
            </Button>

            <div className="rounded-[32px] border border-gray-100 bg-white p-8 shadow-[0_20px_80px_rgba(15,23,42,0.08)]">
              <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-5 py-2 text-xs uppercase tracking-[0.3em] text-gray-500 mb-6">
                <Star className="w-4 h-4 text-gray-900" />
                realm intake
              </div>
              <h1 className="text-3xl md:text-4xl font-light text-gray-900 mb-4">
                Tell us what you’re building; we’ll shape the team around it.
              </h1>
              <p className="text-base text-gray-600 leading-relaxed mb-6">
                This lightweight brief helps Realm align strategy, delivery, and concierge support
                without long calls or drawn-out decks.
              </p>

              <div className="grid sm:grid-cols-3 gap-4">
                <div className="rounded-2xl border border-gray-100 bg-gray-50/70 p-4">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <CheckCircle className="w-4 h-4 text-gray-900" />
                    <span>Kickoff in 7 days</span>
                  </div>
                </div>
                <div className="rounded-2xl border border-gray-100 bg-gray-50/70 p-4">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Users className="w-4 h-4 text-gray-900" />
                    <span>Dedicated PM</span>
                  </div>
                </div>
                <div className="rounded-2xl border border-gray-100 bg-gray-50/70 p-4">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Zap className="w-4 h-4 text-gray-900" />
                    <span>24h response</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-gray-200 bg-white/70 p-6">
              <p className="text-sm text-gray-500 leading-relaxed">
                Prefer a guided walkthrough? Drop a note and we’ll schedule a concierge session to scope
                your delivery plan, budget alignment, and expected milestones.
              </p>
            </div>
          </div>

          {/* Main Form */}
          <div className="bg-white rounded-[36px] border border-gray-100 shadow-[0_25px_70px_rgba(15,23,42,0.09)] overflow-hidden">
            <div className="border-b border-gray-100 px-8 py-6">
              <p className="text-xs uppercase tracking-[0.4em] text-gray-400 mb-2">
                Intake form
              </p>
              <h2 className="text-2xl font-semibold text-gray-900">Project details</h2>
            </div>

            <div className="p-8">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                  {/* Personal Information */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <FormField control={form.control} name="firstName" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-900 font-medium">First Name *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="John" 
                            {...field} 
                            maxLength={30}
                            className="h-12 bg-white border-gray-300 focus:border-primary focus:ring-primary"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={form.control} name="lastName" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-900 font-medium">Last Name</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Doe" 
                            {...field} 
                            maxLength={30}
                            className="h-12 bg-white border-gray-300 focus:border-primary focus:ring-primary"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>

                  <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-900 font-medium">Email Address *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="john.doe@example.com" 
                          {...field} 
                          className="h-12 bg-white border-gray-300 focus:border-primary focus:ring-primary"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <div className="grid md:grid-cols-2 gap-6">
                    <FormField control={form.control} name="phone" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-900 font-medium">Phone Number</FormLabel>
                        <FormControl>
                          <PhoneInput 
                            value={field.value} 
                            onChange={field.onChange}
                            placeholder="Enter phone number"
                            className="h-12"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={form.control} name="business_name" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-900 font-medium">Business Name</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Your Company Name" 
                            {...field} 
                            maxLength={100}
                            className="h-12 bg-white border-gray-300 focus:border-primary focus:ring-primary"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>

                  {/* Services Section */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Services You're Interested In</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      {services.map((service) => (
                        <FormField key={service.id} control={form.control} name="services_interested" render={({ field }) => (
                          <FormItem key={service.id} className="flex flex-row items-start space-x-3 space-y-0 p-4 border border-gray-200 rounded-lg hover:border-primary hover:bg-gray-50/50 transition-colors">
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(service.label)}
                                onCheckedChange={(checked) => {
                                  const currentValue = field.value || [];
                                  return checked
                                    ? field.onChange([...currentValue, service.label])
                                    : field.onChange(currentValue.filter(value => value !== service.label));
                                }}
                                className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                              />
                            </FormControl>
                            <FormLabel className="font-normal text-gray-900 cursor-pointer">{service.label}</FormLabel>
                          </FormItem>
                        )} />
                      ))}
                    </div>
                  </div>

                  {/* Project Details */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <FormField control={form.control} name="budget_range" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-900 font-medium">Monthly Budget</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-12 bg-white border-gray-300 focus:border-primary focus:ring-primary">
                              <SelectValue placeholder="Select budget range" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {budgetRanges.map(range => 
                              <SelectItem key={range} value={range}>{range}</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={form.control} name="lead_source" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-900 font-medium">How did you hear about us?</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-12 bg-white border-gray-300 focus:border-primary focus:ring-primary">
                              <SelectValue placeholder="Select a source" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {leadSources.map(source => 
                              <SelectItem key={source} value={source}>{source}</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>

                  <FormField control={form.control} name="notes" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-900 font-medium">Tell us about your project</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe your project goals, timeline, specific requirements, or any questions you have..."
                          className="min-h-[120px] bg-white border-gray-300 focus:border-primary focus:ring-primary"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  {/* Submit Button */}
                  <div className="pt-4">
                    <Button 
                      type="submit" 
                      disabled={isPending || isSubmitting}
                      className="w-full rounded-2xl bg-gray-900 text-white hover:bg-black py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      {isPending || isSubmitting ? (
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Submitting...
                        </div>
                      ) : (
                        "Get Your Free Proposal"
                      )}
                    </Button>
                    <p className="text-center text-sm text-gray-500 mt-3">
                      We'll review your request and get back to you within 24 hours
                    </p>
                  </div>
                </form>
              </Form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
