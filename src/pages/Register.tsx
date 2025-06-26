
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

const services = [
  { id: "web-development", label: "Web Development", icon: "🌐" },
  { id: "digital-marketing", label: "Digital Marketing", icon: "📱" },
  { id: "seo", label: "SEO Optimization", icon: "🔍" },
  { id: "social-media-management", label: "Social Media Management", icon: "📊" },
  { id: "content-creation", label: "Content Creation", icon: "✨" },
] as const;

const leadSources = ["Website", "Referral", "LinkedIn", "Google Ads", "Social Media", "Other"] as const;

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
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      <Header onLightBg />
      
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              className="mb-6 text-green-600 hover:text-green-700"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
            
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-6">
              <Star className="w-8 h-8 text-green-600" />
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Start Your Digital Journey
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
              Tell us about your vision and we'll craft a custom proposal that brings your business to the next level.
            </p>
            
            {/* Trust Indicators */}
            <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-500 mb-8">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Free Consultation</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-green-500" />
                <span>50+ Happy Clients</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-green-500" />
                <span>24h Response Time</span>
              </div>
            </div>
          </div>

          {/* Main Form */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-green-600 to-blue-600 p-8 text-white">
              <h2 className="text-2xl font-semibold mb-2">Project Details</h2>
              <p className="text-green-100">Help us understand your needs better</p>
            </div>
            
            <div className="p-8">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                  {/* Personal Information */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <FormField control={form.control} name="name" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700 font-medium">Full Name *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="John Doe" 
                            {...field} 
                            className="h-12 border-gray-300 focus:border-green-500 focus:ring-green-500"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={form.control} name="email" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700 font-medium">Email Address *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="john.doe@example.com" 
                            {...field} 
                            className="h-12 border-gray-300 focus:border-green-500 focus:ring-green-500"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <FormField control={form.control} name="phone" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700 font-medium">Phone Number</FormLabel>
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
                        <FormLabel className="text-gray-700 font-medium">Business Name</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Your Company Name" 
                            {...field} 
                            className="h-12 border-gray-300 focus:border-green-500 focus:ring-green-500"
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
                          <FormItem key={service.id} className="flex flex-row items-start space-x-3 space-y-0 p-4 border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50/50 transition-colors">
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(service.label)}
                                onCheckedChange={(checked) => {
                                  const currentValue = field.value || [];
                                  return checked
                                    ? field.onChange([...currentValue, service.label])
                                    : field.onChange(currentValue.filter(value => value !== service.label));
                                }}
                                className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                              />
                            </FormControl>
                            <div className="flex items-center gap-3">
                              <span className="text-xl">{service.icon}</span>
                              <FormLabel className="font-normal text-gray-700">{service.label}</FormLabel>
                            </div>
                          </FormItem>
                        )} />
                      ))}
                    </div>
                  </div>

                  {/* Project Details */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <FormField control={form.control} name="budget_range" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700 font-medium">Estimated Budget Range</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g., $5,000 - $10,000" 
                            {...field} 
                            className="h-12 border-gray-300 focus:border-green-500 focus:ring-green-500"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={form.control} name="lead_source" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700 font-medium">How did you hear about us?</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-12 border-gray-300 focus:border-green-500 focus:ring-green-500">
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
                      <FormLabel className="text-gray-700 font-medium">Tell us about your project</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe your project goals, timeline, specific requirements, or any questions you have..."
                          className="min-h-[120px] border-gray-300 focus:border-green-500 focus:ring-green-500"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  {/* Submit Button */}
                  <div className="pt-6">
                    <Button 
                      type="submit" 
                      disabled={isPending || isSubmitting}
                      className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
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
