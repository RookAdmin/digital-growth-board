
import { useState } from 'react';
import { Invoice } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Eye, Send, CreditCard, Download } from 'lucide-react';
import { format } from 'date-fns';
import { InvoiceDetailsModal } from './InvoiceDetailsModal';
import { PaymentModal } from './PaymentModal';

interface InvoicesTableProps {
  invoices: Invoice[];
  getStatusColor: (status: string) => string;
}

export const InvoicesTable = ({ invoices, getStatusColor }: InvoicesTableProps) => {
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const handleViewDetails = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setShowDetailsModal(true);
  };

  const handleProcessPayment = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setShowPaymentModal(true);
  };

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice #</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Project</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <div className="text-muted-foreground">
                    No invoices found. Create your first invoice to get started.
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              invoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">
                    {invoice.invoice_number}
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{invoice.clients?.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {invoice.clients?.business_name}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {invoice.projects?.name || 'No project'}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">
                      ${Number(invoice.total_amount).toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {invoice.currency}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(invoice.status)}>
                      {invoice.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {format(new Date(invoice.due_date), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDetails(invoice)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      
                      {(invoice.status === 'Sent' || invoice.status === 'Pending' || invoice.status === 'Overdue') && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleProcessPayment(invoice)}
                        >
                          <CreditCard className="h-4 w-4" />
                        </Button>
                      )}
                      
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {selectedInvoice && (
        <>
          <InvoiceDetailsModal
            invoice={selectedInvoice}
            open={showDetailsModal}
            onOpenChange={setShowDetailsModal}
          />
          
          <PaymentModal
            invoice={selectedInvoice}
            open={showPaymentModal}
            onOpenChange={setShowPaymentModal}
          />
        </>
      )}
    </>
  );
};
