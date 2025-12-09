import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { DockNav } from '@/components/DockNav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, Building, MapPin, Phone, Mail, Globe, CreditCard, FileText, FolderOpen, Calendar, DollarSign, Users } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { LoadingState } from '@/components/LoadingState';
import { Tables } from '@/integrations/supabase/types';
import { countries, getStatesByCountry, getCitiesByState } from '@/utils/locationData';

type Partner = Tables<'partners'>;

// Tax types by country
const TAX_TYPES: Record<string, string[]> = {
  'India': ['GST', 'PAN'],
  'United States': ['EIN', 'SSN'],
  'United Kingdom': ['VAT', 'UTR'],
  'Canada': ['HST', 'GST', 'BN'],
  'Australia': ['ABN', 'GST'],
  'Germany': ['VAT', 'Tax ID'],
  'France': ['VAT', 'SIRET'],
  'Italy': ['VAT', 'P.IVA'],
  'Spain': ['VAT', 'NIF'],
  'Netherlands': ['VAT', 'BTW'],
  'Belgium': ['VAT', 'BTW'],
  'Switzerland': ['VAT', 'UID'],
  'Austria': ['VAT', 'UID'],
  'Sweden': ['VAT', 'Org. No.'],
  'Norway': ['VAT', 'Org. No.'],
  'Denmark': ['VAT', 'CVR'],
  'Finland': ['VAT', 'Y-tunnus'],
  'Poland': ['VAT', 'NIP'],
  'Portugal': ['VAT', 'NIF'],
  'Greece': ['VAT', 'AFM'],
  'Ireland': ['VAT', 'CRO'],
  'New Zealand': ['GST', 'IRD'],
  'Singapore': ['GST', 'UEN'],
  'Malaysia': ['GST', 'SSM'],
  'Thailand': ['VAT', 'Tax ID'],
  'Japan': ['Tax ID', 'Corporate Number'],
  'South Korea': ['VAT', 'Business Registration'],
  'China': ['Tax ID', 'Unified Social Credit Code'],
  'Brazil': ['CNPJ', 'CPF'],
  'Mexico': ['RFC', 'Tax ID'],
  'Argentina': ['CUIT', 'Tax ID'],
  'Chile': ['RUT', 'Tax ID'],
  'South Africa': ['VAT', 'Tax ID'],
  'UAE': ['VAT', 'TRN'],
  'Saudi Arabia': ['VAT', 'Tax ID'],
  'Israel': ['VAT', 'Company Number'],
  'Turkey': ['VAT', 'Tax ID'],
};

const PartnerDetails = () => {
  const { workspaceId, id } = useParams<{ workspaceId: string; id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<Partial<Partner>>({});
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [selectedState, setSelectedState] = useState<string>('');
  const [availableStates, setAvailableStates] = useState<string[]>([]);
  const [availableCities, setAvailableCities] = useState<string[]>([]);

  // Fetch partner data
  const { data: partner, isLoading } = useQuery({
    queryKey: ['partner', id],
    queryFn: async () => {
      if (!id) throw new Error('Partner ID is required');
      const { data, error } = await supabase
        .from('partners')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as Partner;
    },
    enabled: !!id,
  });

  // Fetch partner's projects
  const { data: projects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ['partner-projects', id],
    queryFn: async () => {
      if (!id) return [];
      const { data, error } = await supabase
        .from('partner_project_assignments')
        .select(`
          id,
          assigned_role,
          notes,
          assigned_at,
          projects:project_id (
            id,
            name,
            description,
            status,
            deadline,
            budget,
            created_at,
            clients:client_id (
              id,
              name,
              business_name,
              email
            )
          )
        `)
        .eq('partner_id', id)
        .order('assigned_at', { ascending: false });
      
      if (error) throw error;
      return (data || []).map((assignment: any) => ({
        ...assignment.projects,
        assigned_role: assignment.assigned_role,
        notes: assignment.notes,
        assigned_at: assignment.assigned_at,
      })).filter((p: any) => p.id); // Filter out null projects
    },
    enabled: !!id,
  });

  // Update form data when partner loads
  useEffect(() => {
    if (partner) {
      setFormData(partner);
      setSelectedCountry(partner.country || '');
      setSelectedState(partner.state || '');
    }
  }, [partner]);

  // Update states when country changes
  useEffect(() => {
    if (selectedCountry) {
      const states = getStatesByCountry(selectedCountry);
      setAvailableStates(states);
      if (states.length > 0 && !states.includes(selectedState)) {
        setSelectedState('');
        setFormData(prev => ({ ...prev, state: '', city: '' }));
      }
    } else {
      setAvailableStates([]);
      setSelectedState('');
    }
  }, [selectedCountry]);

  // Update cities when state changes
  useEffect(() => {
    if (selectedState && selectedCountry) {
      const cities = getCitiesByState(selectedCountry, selectedState);
      setAvailableCities(cities);
      if (cities.length > 0 && !cities.includes(formData.city || '')) {
        setFormData(prev => ({ ...prev, city: '' }));
      }
    } else {
      setAvailableCities([]);
    }
  }, [selectedState, selectedCountry]);

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: Partial<Partner>) => {
      if (!id) throw new Error('Partner ID is required');
      const { error } = await supabase
        .from('partners')
        .update(data)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partner', id] });
      queryClient.invalidateQueries({ queryKey: ['partners'] });
      toast.success('Partner details updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update partner: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const handleCountryChange = (country: string) => {
    setSelectedCountry(country);
    setFormData(prev => ({ ...prev, country, state: '', city: '' }));
  };

  const handleStateChange = (state: string) => {
    setSelectedState(state);
    setFormData(prev => ({ ...prev, state, city: '' }));
  };

  const taxTypes = selectedCountry ? (TAX_TYPES[selectedCountry] || ['Tax ID']) : ['Tax ID'];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f7f4ef] via-[#f4f1ff] to-[#eef7ff] pb-32">
        <Header isAuthenticated={true} />
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
          <LoadingState message="Loading partner details..." fullHeight />
        </main>
        <DockNav />
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f7f4ef] via-[#f4f1ff] to-[#eef7ff] pb-32">
        <Header isAuthenticated={true} />
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
          <div className="text-center py-12">
            <p className="text-gray-600">Partner not found</p>
            <Button onClick={() => navigate(workspaceId ? `/partners/${workspaceId}` : '/partners')} className="mt-4">
              Back to Partners
            </Button>
          </div>
        </main>
        <DockNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f7f4ef] via-[#f4f1ff] to-[#eef7ff] pb-32">
      <Header isAuthenticated={true} />
      
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        <div className="mb-6 flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate(workspaceId ? `/partners/${workspaceId}` : '/partners')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          <h1 className="text-3xl font-bold text-gray-900">Partner Details</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <Card className="border border-white/80 bg-white/90 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">First Name *</Label>
                  <Input
                    id="first_name"
                    value={formData.first_name || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Last Name *</Label>
                  <Input
                    id="last_name"
                    value={formData.last_name || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name *</Label>
                <Input
                  id="full_name"
                  value={formData.full_name || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="office_phone_no">Office Phone</Label>
                  <Input
                    id="office_phone_no"
                    value={formData.office_phone_no || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, office_phone_no: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="company_name">Company Name</Label>
                <Input
                  id="company_name"
                  value={formData.company_name || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, company_name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="position">Position</Label>
                <Input
                  id="position"
                  value={formData.position || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  type="url"
                  value={formData.website || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                  placeholder="https://example.com"
                />
              </div>
            </CardContent>
          </Card>

          {/* Address Information */}
          <Card className="border border-white/80 bg-white/90 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Address Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="country">Country *</Label>
                <Select value={selectedCountry} onValueChange={handleCountryChange} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {countries.map((country) => (
                      <SelectItem key={country} value={country}>
                        {country}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {selectedCountry && availableStates.length > 0 ? (
                <div className="space-y-2">
                  <Label htmlFor="state">State/Province/Union Territory</Label>
                  <Select value={selectedState} onValueChange={handleStateChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select state/province" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {availableStates.map((state) => (
                        <SelectItem key={state} value={state}>
                          {state}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : selectedCountry ? (
                <div className="space-y-2">
                  <Label htmlFor="state">State/Province/Union Territory</Label>
                  <Input
                    id="state"
                    value={formData.state || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                    placeholder="Enter state/province"
                  />
                </div>
              ) : null}
              {selectedState && availableCities.length > 0 ? (
                <div className="space-y-2">
                  <Label htmlFor="city">City/Town/Village</Label>
                  <Select
                    value={formData.city || ''}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, city: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select city/town" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {availableCities.map((city) => (
                        <SelectItem key={city} value={city}>
                          {city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : selectedState || selectedCountry ? (
                <div className="space-y-2">
                  <Label htmlFor="city">City/Town/Village</Label>
                  <Input
                    id="city"
                    value={formData.city || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                    placeholder="Enter city/town/village"
                  />
                </div>
              ) : null}
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={formData.address || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Bank Details */}
          <Card className="border border-white/80 bg-white/90 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Bank Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="bank_account_holder_name">Account Holder Name</Label>
                <Input
                  id="bank_account_holder_name"
                  value={formData.bank_account_holder_name || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, bank_account_holder_name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bank_name">Bank Name</Label>
                <Input
                  id="bank_name"
                  value={formData.bank_name || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, bank_name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bank_account_number">Account Number</Label>
                <Input
                  id="bank_account_number"
                  value={formData.bank_account_number || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, bank_account_number: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedCountry === 'India' && (
                  <div className="space-y-2">
                    <Label htmlFor="bank_ifsc_code">IFSC Code</Label>
                    <Input
                      id="bank_ifsc_code"
                      value={formData.bank_ifsc_code || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, bank_ifsc_code: e.target.value }))}
                    />
                  </div>
                )}
                {(selectedCountry === 'United States' || selectedCountry === 'Canada') && (
                  <div className="space-y-2">
                    <Label htmlFor="bank_routing_number">Routing Number</Label>
                    <Input
                      id="bank_routing_number"
                      value={formData.bank_routing_number || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, bank_routing_number: e.target.value }))}
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="bank_swift_code">SWIFT Code (International)</Label>
                  <Input
                    id="bank_swift_code"
                    value={formData.bank_swift_code || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, bank_swift_code: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="bank_branch_name">Branch Name</Label>
                <Input
                  id="bank_branch_name"
                  value={formData.bank_branch_name || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, bank_branch_name: e.target.value }))}
                />
              </div>
            </CardContent>
          </Card>

          {/* Tax Details */}
          <Card className="border border-white/80 bg-white/90 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Tax Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedCountry && (
                <div className="space-y-2">
                  <Label htmlFor="tax_id_type">Tax ID Type *</Label>
                  <Select
                    value={formData.tax_id_type || ''}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, tax_id_type: value }))}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select tax ID type" />
                    </SelectTrigger>
                    <SelectContent>
                      {taxTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="tax_id_number">Tax ID Number</Label>
                <Input
                  id="tax_id_number"
                  value={formData.tax_id_number || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, tax_id_number: e.target.value }))}
                />
              </div>
              {selectedCountry === 'India' && (
                <div className="space-y-2">
                  <Label htmlFor="gst_no">GST Number</Label>
                  <Input
                    id="gst_no"
                    value={formData.gst_no || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, gst_no: e.target.value }))}
                  />
                </div>
              )}
              {(selectedCountry === 'United Kingdom' || selectedCountry === 'Germany' || selectedCountry === 'France' || 
                selectedCountry === 'Italy' || selectedCountry === 'Spain' || selectedCountry === 'Netherlands' ||
                selectedCountry === 'Belgium' || selectedCountry === 'Switzerland' || selectedCountry === 'Austria' ||
                selectedCountry === 'Sweden' || selectedCountry === 'Norway' || selectedCountry === 'Denmark' ||
                selectedCountry === 'Finland' || selectedCountry === 'Poland' || selectedCountry === 'Portugal' ||
                selectedCountry === 'Greece' || selectedCountry === 'Ireland' || selectedCountry === 'UAE' ||
                selectedCountry === 'Saudi Arabia' || selectedCountry === 'Israel' || selectedCountry === 'Turkey' ||
                selectedCountry === 'Thailand' || selectedCountry === 'South Korea') && (
                <div className="space-y-2">
                  <Label htmlFor="vat_number">VAT Number</Label>
                  <Input
                    id="vat_number"
                    value={formData.vat_number || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, vat_number: e.target.value }))}
                  />
                </div>
              )}
              {selectedCountry === 'United States' && (
                <div className="space-y-2">
                  <Label htmlFor="ein_number">EIN Number</Label>
                  <Input
                    id="ein_number"
                    value={formData.ein_number || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, ein_number: e.target.value }))}
                  />
                </div>
              )}
              {selectedCountry === 'Australia' && (
                <div className="space-y-2">
                  <Label htmlFor="abn_number">ABN Number</Label>
                  <Input
                    id="abn_number"
                    value={formData.abn_number || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, abn_number: e.target.value }))}
                  />
                </div>
              )}
              {selectedCountry === 'Canada' && (
                <div className="space-y-2">
                  <Label htmlFor="hst_number">HST Number</Label>
                  <Input
                    id="hst_number"
                    value={formData.hst_number || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, hst_number: e.target.value }))}
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="business_number">Business Registration Number</Label>
                <Input
                  id="business_number"
                  value={formData.business_number || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, business_number: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="registration_type">Registration Type</Label>
                <Select
                  value={formData.registration_type || ''}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, registration_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select registration type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Sole Proprietorship">Sole Proprietorship</SelectItem>
                    <SelectItem value="Partnership">Partnership</SelectItem>
                    <SelectItem value="LLC">LLC</SelectItem>
                    <SelectItem value="Corporation">Corporation</SelectItem>
                    <SelectItem value="Private Limited">Private Limited</SelectItem>
                    <SelectItem value="Public Limited">Public Limited</SelectItem>
                    <SelectItem value="Limited Partnership">Limited Partnership</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(workspaceId ? `/partners/${workspaceId}` : '/partners')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updateMutation.isPending}
              className="bg-gray-900 text-white hover:bg-black"
            >
              <Save className="h-4 w-4 mr-2" />
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>

        {/* Projects Section */}
        <Card className="border border-white/80 bg-white/90 shadow-lg mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5" />
              Assigned Projects
              {projects && projects.length > 0 && (
                <Badge variant="secondary">{projects.length}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {projectsLoading ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Loading projects...</p>
              </div>
            ) : projects && projects.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {projects.map((project: any) => (
                  <Card 
                    key={project.id}
                    className="cursor-pointer hover:shadow-md transition-shadow border-gray-200"
                    onClick={() => workspaceId && navigate(`/projects/${workspaceId}/${project.id}`)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg">{project.name}</CardTitle>
                        <Badge 
                          className={`${
                            project.status === 'Not Started' ? 'bg-[#F1F1F1] text-[#131313]' :
                            project.status === 'In Progress' ? 'bg-[#131313] text-[#FAF9F6]' :
                            project.status === 'Review' ? 'bg-[#222222] text-[#FAF9F6]' :
                            'bg-[#FAF9F6] text-[#131313]'
                          } text-xs font-medium px-2 py-1 rounded-full`} 
                          variant="outline"
                        >
                          {project.status}
                        </Badge>
                      </div>
                      {project.clients && (
                        <p className="text-sm text-gray-600 mt-1">
                          {project.clients.business_name || project.clients.name}
                        </p>
                      )}
                      {project.assigned_role && (
                        <Badge variant="outline" className="mt-2 text-xs">
                          Role: {project.assigned_role}
                        </Badge>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {project.description && (
                        <p className="text-sm text-gray-600 line-clamp-2">{project.description}</p>
                      )}
                      <div className="space-y-2 text-sm">
                        {project.deadline && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <Calendar className="w-4 h-4" />
                            <span>Due: {format(new Date(project.deadline), 'MMM dd, yyyy')}</span>
                          </div>
                        )}
                        {project.budget && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <DollarSign className="w-4 h-4" />
                            <span>${project.budget.toLocaleString()}</span>
                          </div>
                        )}
                        {project.assigned_at && (
                          <div className="flex items-center gap-2 text-gray-500 text-xs">
                            <Calendar className="w-3 h-3" />
                            <span>Assigned: {format(new Date(project.assigned_at), 'MMM dd, yyyy')}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FolderOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-2">No projects assigned to this partner yet.</p>
                <Button 
                  onClick={() => workspaceId && navigate(`/partners/${workspaceId}`)} 
                  variant="outline"
                >
                  Back to Partners
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
      <DockNav />
    </div>
  );
};

export default PartnerDetails;

