import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { DockNav } from '@/components/DockNav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ReceiptText, FileText, Search, Plus, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { pillClasses } from '@/constants/palette';
import { LoadingState } from '@/components/LoadingState';
import { AddInvoiceForm } from '@/components/AddInvoiceForm';

const getInvoiceStatusColor = (status: string) => {
  switch (status) {
    case 'Paid':
      return pillClasses.soft;
    case 'Sent':
      return pillClasses.dark;
    case 'Overdue':
      return pillClasses.charcoal;
    case 'Draft':
    default:
      return pillClasses.light;
  }
};

const formatCurrency = (value: number, currency: string) => {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value || 0);
  } catch {
    return `$${(value || 0).toFixed(2)}`;
  }
};

const Billing = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showAddInvoice, setShowAddInvoice] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Billing - Rook";
  }, []);

  // Fetch all invoices
  const { data: invoices = [], isLoading: isLoadingInvoices } = useQuery({
    queryKey: ['all-invoices'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          projects(id, name),
          clients(id, name, business_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  // Fetch projects for invoice creation
  const { data: projects = [] } = useQuery({
    queryKey: ['projects-for-billing'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('id, name, client_id, clients(id, name, business_name)')
        .order('name', { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });

  // Fetch milestones for selected project
  const { data: milestones = [] } = useQuery({
    queryKey: ['project-milestones', selectedProjectId],
    queryFn: async () => {
      if (!selectedProjectId) return [];
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('project_id', selectedProjectId)
        .eq('type', 'milestone')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedProjectId,
  });

  // Filter invoices
  const filteredInvoices = invoices.filter((invoice: any) => {
    const matchesSearch = 
      invoice.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.projects?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.clients?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.clients?.business_name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Calculate totals
  const totalAmount = filteredInvoices.reduce((sum: number, invoice: any) => sum + (invoice.total_amount || invoice.amount || 0), 0);
  const paidAmount = filteredInvoices
    .filter((invoice: any) => invoice.status === 'Paid')
    .reduce((sum: number, invoice: any) => sum + (invoice.total_amount || invoice.amount || 0), 0);
  const pendingAmount = filteredInvoices
    .filter((invoice: any) => invoice.status !== 'Paid')
    .reduce((sum: number, invoice: any) => sum + (invoice.total_amount || invoice.amount || 0), 0);

  const handleProjectSelect = (projectId: string) => {
    setSelectedProjectId(projectId);
    const project = projects.find((p: any) => p.id === projectId);
    if (project) {
      setSelectedClientId(project.client_id);
    }
    setShowAddInvoice(true);
  };

  if (isLoadingInvoices) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] pb-32">
        <Header isAuthenticated={true} />
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <LoadingState message="Loading invoices..." fullHeight />
        </main>
        <DockNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] pb-32">
      <Header isAuthenticated={true} />
      
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-black mb-2">
            Billing & Invoices
          </h1>
          <p className="text-sm sm:text-base lg:text-lg text-gray-600 font-light">
            Manage all project invoices and billing information
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-500">Total Invoices</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{filteredInvoices.length}</div>
              <div className="text-sm text-gray-500 mt-1">{formatCurrency(totalAmount, 'USD')}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-500">Paid</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(paidAmount, 'USD')}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                {filteredInvoices.filter((i: any) => i.status === 'Paid').length} invoices
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-500">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {formatCurrency(pendingAmount, 'USD')}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                {filteredInvoices.filter((i: any) => i.status !== 'Paid').length} invoices
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Actions */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <CardTitle className="flex items-center gap-2">
                <ReceiptText className="w-5 h-5" />
                All Invoices
              </CardTitle>
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <Select value={selectedProjectId || ''} onValueChange={handleProjectSelect}>
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue placeholder="Select Project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((project: any) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search invoices..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Draft">Draft</SelectItem>
                  <SelectItem value="Sent">Sent</SelectItem>
                  <SelectItem value="Paid">Paid</SelectItem>
                  <SelectItem value="Overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {showAddInvoice && selectedProjectId && selectedClientId && (
              <div className="mb-6 p-4 border rounded-lg bg-gray-50">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Create New Invoice</h3>
                  <Button variant="ghost" size="sm" onClick={() => {
                    setShowAddInvoice(false);
                    setSelectedProjectId(null);
                    setSelectedClientId(null);
                  }}>
                    Close
                  </Button>
                </div>
                <AddInvoiceForm
                  projectId={selectedProjectId}
                  clientId={selectedClientId}
                  milestones={milestones}
                  onCancel={() => {
                    setShowAddInvoice(false);
                    setSelectedProjectId(null);
                    setSelectedClientId(null);
                  }}
                />
              </div>
            )}

            {/* Invoices List */}
            {filteredInvoices.length === 0 ? (
              <div className="text-center py-12">
                <ReceiptText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No invoices found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredInvoices.map((invoice: any) => (
                  <div
                    key={invoice.id}
                    className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-semibold text-lg text-gray-900">{invoice.title}</h3>
                            <p className="text-sm text-gray-500">#{invoice.invoice_number}</p>
                          </div>
                          <Badge className={`${getInvoiceStatusColor(invoice.status)} text-xs`} variant="secondary">
                            {invoice.status}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar className="w-4 h-4" />
                            <span>Issued: {format(new Date(invoice.issued_date), 'MMM dd, yyyy')}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar className="w-4 h-4" />
                            <span>Due: {format(new Date(invoice.due_date), 'MMM dd, yyyy')}</span>
                          </div>
                          {invoice.projects && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <span className="font-medium">Project:</span>
                              <span>{invoice.projects.name}</span>
                            </div>
                          )}
                          {invoice.clients && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <span className="font-medium">Client:</span>
                              <span>{invoice.clients.business_name || invoice.clients.name}</span>
                            </div>
                          )}
                        </div>

                        {invoice.description && (
                          <p className="text-sm text-gray-600 mt-3">{invoice.description}</p>
                        )}
                      </div>

                      <div className="flex flex-col items-end gap-3 lg:min-w-[200px]">
                        <div className="text-right">
                          <div className="text-2xl font-bold text-gray-900">
                            {formatCurrency(invoice.total_amount || invoice.amount, invoice.currency || 'USD')}
                          </div>
                          {invoice.tax_amount && invoice.tax_amount > 0 && (
                            <div className="text-xs text-gray-500 mt-1">
                              Tax: {formatCurrency(invoice.tax_amount, invoice.currency || 'USD')}
                            </div>
                          )}
                        </div>

                        {invoice.pdf_url && (
                          <Button
                            asChild
                            variant="outline"
                            size="sm"
                            className="w-full lg:w-auto"
                          >
                            <a
                              href={invoice.pdf_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2"
                            >
                              <FileText className="h-4 w-4" />
                              View PDF
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
      <DockNav />
    </div>
  );
};

export default Billing;

