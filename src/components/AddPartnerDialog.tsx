import { useState } from 'react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface AddPartnerDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const serviceCategories = ['design', 'development', 'content', 'marketing', 'seo', 'social-media'];

const registrationTypes = [
  'Sole Proprietorship',
  'Partnership',
  'LLC',
  'Corporation',
  'Private Limited',
  'Public Limited',
  'Other'
];

export function AddPartnerDialog({ isOpen, onOpenChange, onSuccess }: AddPartnerDialogProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    companyName: '',
    gstNo: '',
    registrationType: '',
    address: '',
    website: '',
    position: '',
    officePhoneNo: '',
    city: '',
    state: '',
    country: '',
    password: '',
    selectedCategories: [] as string[],
  });

  const addPartnerMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const fullName = `${data.firstName} ${data.lastName}`.trim();
      
      // Step 1: Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            user_type: 'partner',
            full_name: fullName,
            first_name: data.firstName,
            last_name: data.lastName,
            phone: data.phone,
            company_name: data.companyName,
            service_categories: data.selectedCategories.join(','),
          }
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Failed to create user');

      // Step 2: Create partner record
      const { error: partnerError } = await supabase
        .from('partners')
        .insert({
          user_id: authData.user.id,
          full_name: fullName,
          first_name: data.firstName,
          last_name: data.lastName,
          email: data.email,
          phone: data.phone || null,
          company_name: data.companyName || null,
          gst_no: data.gstNo || null,
          registration_type: data.registrationType || null,
          address: data.address || null,
          website: data.website || null,
          position: data.position || null,
          office_phone_no: data.officePhoneNo || null,
          city: data.city || null,
          state: data.state || null,
          country: data.country || null,
          service_categories: data.selectedCategories.length > 0 ? data.selectedCategories : null,
          is_active: true,
        });

      if (partnerError) throw partnerError;

      return authData;
    },
    onSuccess: () => {
      toast.success('Partner added successfully!');
      queryClient.invalidateQueries({ queryKey: ['partners'] });
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        companyName: '',
        gstNo: '',
        registrationType: '',
        address: '',
        website: '',
        position: '',
        officePhoneNo: '',
        city: '',
        state: '',
        country: '',
        password: '',
        selectedCategories: [],
      });
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast.error('Failed to add partner: ' + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    addPartnerMutation.mutate(formData);
  };

  const handleCategoryToggle = (category: string) => {
    setFormData(prev => ({
      ...prev,
      selectedCategories: prev.selectedCategories.includes(category)
        ? prev.selectedCategories.filter(c => c !== category)
        : [...prev.selectedCategories, category]
    }));
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData(prev => ({ ...prev, password }));
    toast.success('Password generated');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Partner</DialogTitle>
          <DialogDescription>
            Create a new partner account. They will receive login credentials via email.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">
                First Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                placeholder="John"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">
                Last Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                placeholder="Doe"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">
                Email <span className="text-destructive">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="john@example.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="+1234567890"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                value={formData.companyName}
                onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                placeholder="ABC Agency"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gstNo">GST Number</Label>
              <Input
                id="gstNo"
                value={formData.gstNo}
                onChange={(e) => setFormData(prev => ({ ...prev, gstNo: e.target.value }))}
                placeholder="22AAAAA0000A1Z5"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="registrationType">Registration Type</Label>
              <select
                id="registrationType"
                value={formData.registrationType}
                onChange={(e) => setFormData(prev => ({ ...prev, registrationType: e.target.value }))}
                className="w-full h-10 px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Select type...</option>
                {registrationTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="position">Position</Label>
              <Input
                id="position"
                value={formData.position}
                onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                placeholder="CEO"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                placeholder="123 Main Street"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                placeholder="New York"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                value={formData.state}
                onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                placeholder="NY"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                value={formData.country}
                onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                placeholder="USA"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                type="url"
                value={formData.website}
                onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                placeholder="https://example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="officePhoneNo">Office Phone Number</Label>
              <Input
                id="officePhoneNo"
                type="tel"
                value={formData.officePhoneNo}
                onChange={(e) => setFormData(prev => ({ ...prev, officePhoneNo: e.target.value }))}
                placeholder="+1234567890"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="password">
                Password <span className="text-destructive">*</span>
              </Label>
              <div className="flex gap-2">
                <Input
                  id="password"
                  type="text"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Minimum 6 characters"
                  required
                  minLength={6}
                />
                <Button type="button" variant="outline" onClick={generatePassword}>
                  Generate
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Service Categories</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {serviceCategories.map((category) => (
                <div key={category} className="flex items-center space-x-2">
                  <Checkbox
                    id={`category-${category}`}
                    checked={formData.selectedCategories.includes(category)}
                    onCheckedChange={() => handleCategoryToggle(category)}
                  />
                  <Label
                    htmlFor={`category-${category}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={addPartnerMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={addPartnerMutation.isPending}>
              {addPartnerMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Add Partner
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
