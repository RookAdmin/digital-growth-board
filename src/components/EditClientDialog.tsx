
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Client } from '@/types';
import { Edit } from 'lucide-react';
import { PhoneInput } from '@/components/PhoneInput';

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
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

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
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Edit className="h-4 w-4 mr-2" />
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Client</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="first_name">First Name *</Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) => handleInputChange('first_name', e.target.value)}
                required
                maxLength={18}
              />
            </div>
            <div>
              <Label htmlFor="last_name">Last Name</Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) => handleInputChange('last_name', e.target.value)}
                maxLength={18}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              required
              maxLength={18}
            />
          </div>

          <div>
            <Label htmlFor="phone">Phone Number</Label>
            <PhoneInput
              value={formData.phone}
              onChange={(value) => handleInputChange('phone', value)}
              placeholder="Enter phone number"
            />
          </div>

          <div>
            <Label htmlFor="business_name">Business Name</Label>
            <Input
              id="business_name"
              value={formData.business_name}
              onChange={(e) => handleInputChange('business_name', e.target.value)}
              maxLength={18}
            />
          </div>

          <div>
            <Label htmlFor="legal_name">Legal Name</Label>
            <Input
              id="legal_name"
              value={formData.legal_name}
              onChange={(e) => handleInputChange('legal_name', e.target.value)}
              maxLength={18}
            />
          </div>

          <div>
            <Label htmlFor="gst_no">GST No.</Label>
            <Input
              id="gst_no"
              value={formData.gst_no}
              onChange={(e) => handleInputChange('gst_no', e.target.value)}
              maxLength={18}
            />
          </div>

          <div>
            <Label htmlFor="industry">Industry</Label>
            <Input
              id="industry"
              value={formData.industry}
              onChange={(e) => handleInputChange('industry', e.target.value)}
              maxLength={18}
            />
          </div>

          <div>
            <Label htmlFor="facebook_url">Facebook URL</Label>
            <Input
              id="facebook_url"
              type="url"
              value={formData.facebook_url}
              onChange={(e) => handleInputChange('facebook_url', e.target.value)}
              placeholder="https://facebook.com/..."
              maxLength={18}
            />
          </div>

          <div>
            <Label htmlFor="instagram_url">Instagram URL</Label>
            <Input
              id="instagram_url"
              type="url"
              value={formData.instagram_url}
              onChange={(e) => handleInputChange('instagram_url', e.target.value)}
              placeholder="https://instagram.com/..."
              maxLength={18}
            />
          </div>

          <div>
            <Label htmlFor="linkedin_url">LinkedIn URL</Label>
            <Input
              id="linkedin_url"
              type="url"
              value={formData.linkedin_url}
              onChange={(e) => handleInputChange('linkedin_url', e.target.value)}
              placeholder="https://linkedin.com/..."
              maxLength={18}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateClientMutation.isPending}>
              {updateClientMutation.isPending ? 'Updating...' : 'Update Client'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
