import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Lead, LeadStatus } from '@/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { LeadStatusHistoryComponent } from './LeadStatusHistory';
import { PhoneInput } from './PhoneInput';

interface LeadDetailsModalProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateLeadStatus: (leadId: string, status: LeadStatus) => void;
}

export const LeadDetailsModal = ({ lead, isOpen, onClose, onUpdateLeadStatus }: LeadDetailsModalProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ name: '', email: '', phone: '', status: '' as LeadStatus });
  const queryClient = useQueryClient();

  useEffect(() => {
    if (lead) {
      setEditData({
        name: lead.name,
        email: lead.email,
        phone: lead.phone || '',
        status: lead.status,
      });
    }
  }, [lead]);

  const updateLeadMutation = useMutation({
    mutationFn: async (updates: Partial<Lead>) => {
      if (!lead) throw new Error('No lead selected');
      const { data, error } = await supabase.from('leads').update(updates).eq('id', lead.id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['leads-with-history'] });
      setIsEditing(false);
      toast.success('Lead updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update lead: ' + error.message);
    },
  });

  const handleSave = () => {
    if (!editData.name.trim() || !editData.email.trim()) {
      toast.error('Name and email are required');
      return;
    }
    
    const updates: Partial<Lead> = {
      name: editData.name.trim(),
      email: editData.email.trim(),
      phone: editData.phone.trim() || null,
    };
    
    if (editData.status !== lead?.status) {
      updates.status = editData.status;
      onUpdateLeadStatus(lead!.id, editData.status);
    }
    
    updateLeadMutation.mutate(updates);
  };

  const getStatusColor = (status: LeadStatus) => {
    switch (status) {
      case 'New':
        return 'bg-blue-100 text-blue-800';
      case 'Contacted':
        return 'bg-yellow-100 text-yellow-800';
      case 'Qualified':
        return 'bg-green-100 text-green-800';
      case 'Proposal Sent':
        return 'bg-purple-100 text-purple-800';
      case 'Converted':
        return 'bg-emerald-100 text-emerald-800';
      case 'Dropped':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!lead) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Lead Details
            <Badge className={getStatusColor(lead.status)} variant="secondary">
              {lead.status}
            </Badge>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {isEditing ? (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Name *</Label>
                <Input
                  id="edit-name"
                  value={editData.name}
                  onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                  placeholder="Enter lead name"
                />
              </div>
              <div>
                <Label htmlFor="edit-email">Email *</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editData.email}
                  onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                  placeholder="Enter email address"
                />
              </div>
              <div>
                <Label htmlFor="edit-phone">Phone</Label>
                <PhoneInput
                  value={editData.phone}
                  onChange={(phone) => setEditData({ ...editData, phone })}
                  placeholder="Enter phone number"
                />
              </div>
              <div>
                <Label htmlFor="edit-status">Status *</Label>
                <Select value={editData.status} onValueChange={(value: LeadStatus) => setEditData({ ...editData, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="New">New</SelectItem>
                    <SelectItem value="Contacted">Contacted</SelectItem>
                    <SelectItem value="Qualified">Qualified</SelectItem>
                    <SelectItem value="Proposal Sent">Proposal Sent</SelectItem>
                    <SelectItem value="Converted">Converted</SelectItem>
                    <SelectItem value="Dropped">Dropped</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={updateLeadMutation.isPending}>
                  {updateLeadMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <Label className="font-semibold">Name</Label>
                <p className="text-sm text-muted-foreground">{lead.name}</p>
              </div>
              <div>
                <Label className="font-semibold">Email</Label>
                <p className="text-sm text-muted-foreground">{lead.email}</p>
              </div>
              <div>
                <Label className="font-semibold">Phone</Label>
                <p className="text-sm text-muted-foreground">{lead.phone || 'Not provided'}</p>
              </div>
              <div>
                <Label className="font-semibold">Created</Label>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(lead.created_at), 'PPP at p')}
                </p>
              </div>
            </div>
          )}
          
          <LeadStatusHistoryComponent leadId={lead.id} />
          
          {!isEditing && (
            <div className="flex justify-end">
              <Button onClick={() => setIsEditing(true)}>
                Edit Lead
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
