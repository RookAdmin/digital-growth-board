
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Invoice } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CreditCard, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

interface PaymentModalProps {
  invoice: Invoice;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PaymentModal = ({ invoice, open, onOpenChange }: PaymentModalProps) => {
  const queryClient = useQueryClient();
  const [paymentData, setPaymentData] = useState({
    payment_method: 'Stripe',
    amount: Number(invoice.total_amount),
    notes: ''
  });

  const recordPaymentMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from('payments')
        .insert({
          invoice_id: invoice.id,
          ...data,
          status: 'Completed',
          payment_date: new Date().toISOString(),
          currency: invoice.currency
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice-stats'] });
      queryClient.invalidateQueries({ queryKey: ['invoice-payments', invoice.id] });
      toast.success('Payment recorded successfully');
      onOpenChange(false);
      resetForm();
    },
    onError: (error) => {
      console.error('Error recording payment:', error);
      toast.error('Failed to record payment');
    }
  });

  const resetForm = () => {
    setPaymentData({
      payment_method: 'Stripe',
      amount: Number(invoice.total_amount),
      notes: ''
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (paymentData.amount <= 0) {
      toast.error('Payment amount must be greater than 0');
      return;
    }

    if (paymentData.amount > Number(invoice.total_amount)) {
      toast.error('Payment amount cannot exceed invoice total');
      return;
    }

    recordPaymentMutation.mutate(paymentData);
  };

  const processStripePayment = () => {
    // In a real implementation, this would integrate with Stripe
    toast.info('Stripe integration not implemented in demo');
  };

  const processRazorpayPayment = () => {
    // In a real implementation, this would integrate with Razorpay
    toast.info('Razorpay integration not implemented in demo');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Process Payment - {invoice.invoice_number}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Invoice Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Invoice Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Client:</span>
                <span className="font-medium">{invoice.clients?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Invoice Total:</span>
                <span className="font-medium">${Number(invoice.total_amount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status:</span>
                <Badge variant="secondary">{invoice.status}</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Payment Gateway Options */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Gateway
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button 
                  variant="outline" 
                  className="h-20 flex flex-col items-center gap-2"
                  onClick={processStripePayment}
                >
                  <CreditCard className="h-6 w-6" />
                  <span>Pay with Stripe</span>
                  <span className="text-xs text-muted-foreground">Credit/Debit Cards</span>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="h-20 flex flex-col items-center gap-2"
                  onClick={processRazorpayPayment}
                >
                  <DollarSign className="h-6 w-6" />
                  <span>Pay with Razorpay</span>
                  <span className="text-xs text-muted-foreground">Multiple Payment Methods</span>
                </Button>
              </div>
              
              <div className="text-center text-sm text-muted-foreground">
                Or record payment manually below
              </div>
            </CardContent>
          </Card>

          {/* Manual Payment Recording */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Record Payment Manually</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="payment_method">Payment Method</Label>
                    <Select 
                      value={paymentData.payment_method} 
                      onValueChange={(value) => setPaymentData({...paymentData, payment_method: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Stripe">Stripe</SelectItem>
                        <SelectItem value="Razorpay">Razorpay</SelectItem>
                        <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                        <SelectItem value="Cash">Cash</SelectItem>
                        <SelectItem value="Check">Check</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="amount">Payment Amount ($)</Label>
                    <Input
                      id="amount"
                      type="number"
                      min="0"
                      max={Number(invoice.total_amount)}
                      step="0.01"
                      value={paymentData.amount}
                      onChange={(e) => setPaymentData({...paymentData, amount: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Payment Notes</Label>
                  <Textarea
                    id="notes"
                    value={paymentData.notes}
                    onChange={(e) => setPaymentData({...paymentData, notes: e.target.value})}
                    placeholder="Additional payment details..."
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => onOpenChange(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={recordPaymentMutation.isPending}
                  >
                    {recordPaymentMutation.isPending ? 'Recording...' : 'Record Payment'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};
