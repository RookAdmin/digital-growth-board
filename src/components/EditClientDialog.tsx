
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Client } from '@/types';
import { Edit } from 'lucide-react';
import { PhoneInput } from '@/components/PhoneInput';
import { Country, State, City } from 'country-state-city';

interface EditClientDialogProps {
  client: Client;
}

export const EditClientDialog = ({ client }: EditClientDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    first_name: client.name.split(' ')[0] || '',
    last_name: client.name.split(' ').slice(1).join(' ') || '',
    email: client.email,
    phone: client.phone || '',
    business_name: client.business_name || '',
    legal_name: '',
    gst_no: '',
    industry: '',
    facebook_url: '',
    instagram_url: '',
    linkedin_url: '',
    country: (client as any).country || '',
    state: (client as any).state || '',
    city: (client as any).city || '',
    pincode: (client as any).pincode || '',
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const countries = Country.getAllCountries();
  const states = formData.country ? State.getStatesOfCountry(formData.country) : [];
  const cities = formData.state ? City.getCitiesOfState(formData.country, formData.state) : [];

  const updateClientMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const fullName = `${data.first_name} ${data.last_name}`.trim();
      const { error } = await supabase
        .from('clients')
        .update({
          name: fullName,
          email: data.email,
          phone: data.phone,
          business_name: data.business_name,
          country: data.country,
          state: data.state,
          city: data.city,
          pincode: data.pincode,
        })
        .eq('id', client.id);

      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast({
        title: "Client Updated",
        description: "Client information has been successfully updated.",
      });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setIsOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to update client: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateClientMutation.mutate(formData);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      
      // Reset dependent fields when parent changes
      if (field === 'country') {
        newData.state = '';
        newData.city = '';
      } else if (field === 'state') {
        newData.city = '';
      }
      
      return newData;
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-xl"
        >
          <Edit className="h-4 w-4 mr-2" />
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto bg-white border border-gray-200 rounded-xl shadow-lg">
        <DialogHeader>
          <DialogTitle className="text-black">Edit Client</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="first_name" className="text-black">First Name *</Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) => handleInputChange('first_name', e.target.value)}
                required
                maxLength={18}
                className="bg-white border border-gray-300 text-black rounded-xl"
              />
            </div>
            <div>
              <Label htmlFor="last_name" className="text-black">Last Name</Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) => handleInputChange('last_name', e.target.value)}
                maxLength={18}
                className="bg-white border border-gray-300 text-black rounded-xl"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="email" className="text-black">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              required
              className="bg-white border border-gray-300 text-black rounded-xl"
            />
          </div>

          <div>
            <Label htmlFor="phone" className="text-black">Phone Number</Label>
            <PhoneInput
              value={formData.phone}
              onChange={(value) => handleInputChange('phone', value)}
              placeholder="Enter phone number"
            />
          </div>

          <div>
            <Label htmlFor="business_name" className="text-black">Business Name</Label>
            <Input
              id="business_name"
              value={formData.business_name}
              onChange={(e) => handleInputChange('business_name', e.target.value)}
              maxLength={18}
              className="bg-white border border-gray-300 text-black rounded-xl"
            />
          </div>

          <div>
            <Label htmlFor="legal_name" className="text-black">Legal Name</Label>
            <Input
              id="legal_name"
              value={formData.legal_name}
              onChange={(e) => handleInputChange('legal_name', e.target.value)}
              maxLength={18}
              className="bg-white border border-gray-300 text-black rounded-xl"
            />
          </div>

          <div>
            <Label htmlFor="gst_no" className="text-black">GST No.</Label>
            <Input
              id="gst_no"
              value={formData.gst_no}
              onChange={(e) => handleInputChange('gst_no', e.target.value)}
              maxLength={18}
              className="bg-white border border-gray-300 text-black rounded-xl"
            />
          </div>

          <div>
            <Label htmlFor="industry" className="text-black">Industry</Label>
            <Input
              id="industry"
              value={formData.industry}
              onChange={(e) => handleInputChange('industry', e.target.value)}
              maxLength={18}
              className="bg-white border border-gray-300 text-black rounded-xl"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="country" className="text-black">Country</Label>
              <Select value={formData.country} onValueChange={(value) => handleInputChange('country', value)}>
                <SelectTrigger className="bg-white border-gray-300 text-black">
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-300">
                  {countries.map((country) => (
                    <SelectItem key={country.isoCode} value={country.isoCode} className="text-black hover:bg-gray-100">
                      {country.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="state" className="text-black">State</Label>
              <Select value={formData.state} onValueChange={(value) => handleInputChange('state', value)} disabled={!formData.country}>
                <SelectTrigger className="bg-white border-gray-300 text-black">
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-300">
                  {states.map((state) => (
                    <SelectItem key={state.isoCode} value={state.isoCode} className="text-black hover:bg-gray-100">
                      {state.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="city" className="text-black">City</Label>
              <Select value={formData.city} onValueChange={(value) => handleInputChange('city', value)} disabled={!formData.state}>
                <SelectTrigger className="bg-white border-gray-300 text-black">
                  <SelectValue placeholder="Select city" />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-300">
                  {cities.map((city) => (
                    <SelectItem key={city.name} value={city.name} className="text-black hover:bg-gray-100">
                      {city.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="pincode" className="text-black">Pincode</Label>
              <Input
                id="pincode"
                value={formData.pincode}
                onChange={(e) => handleInputChange('pincode', e.target.value)}
                maxLength={10}
                placeholder="Enter pincode"
                className="bg-white border border-gray-300 text-black rounded-xl"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="facebook_url" className="text-black">Facebook URL</Label>
            <Input
              id="facebook_url"
              type="url"
              value={formData.facebook_url}
              onChange={(e) => handleInputChange('facebook_url', e.target.value)}
              placeholder="https://facebook.com/..."
              maxLength={18}
              className="bg-white border border-gray-300 text-black rounded-xl"
            />
          </div>

          <div>
            <Label htmlFor="instagram_url" className="text-black">Instagram URL</Label>
            <Input
              id="instagram_url"
              type="url"
              value={formData.instagram_url}
              onChange={(e) => handleInputChange('instagram_url', e.target.value)}
              placeholder="https://instagram.com/..."
              maxLength={18}
              className="bg-white border border-gray-300 text-black rounded-xl"
            />
          </div>

          <div>
            <Label htmlFor="linkedin_url" className="text-black">LinkedIn URL</Label>
            <Input
              id="linkedin_url"
              type="url"
              value={formData.linkedin_url}
              onChange={(e) => handleInputChange('linkedin_url', e.target.value)}
              placeholder="https://linkedin.com/..."
              maxLength={18}
              className="bg-white border border-gray-300 text-black rounded-xl"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsOpen(false)}
              className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-xl"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={updateClientMutation.isPending}
              className="bg-gray-900 text-white hover:bg-gray-800 hover:text-white rounded-xl"
            >
              {updateClientMutation.isPending ? 'Updating...' : 'Update Client'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
