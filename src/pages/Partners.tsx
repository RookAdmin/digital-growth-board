
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, UserPlus, MapPin, Phone, Mail, Building } from 'lucide-react';
import { AssignPartnerDialog } from '@/components/AssignPartnerDialog';
import { Tables } from '@/integrations/supabase/types';

type Partner = Tables<'partners'>;

const Partners = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedServiceCategory, setSelectedServiceCategory] = useState<string>('');
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);

  const { data: partners = [], isLoading } = useQuery({
    queryKey: ['partners'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('partners')
        .select(`
          *,
          partner_project_assignments (
            id,
            projects:project_id (
              id,
              name,
              status
            )
          )
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    }
  });

  const serviceCategories = ['design', 'development', 'content', 'marketing', 'seo', 'social-media'];

  const filteredPartners = partners.filter(partner => {
    const matchesSearch = !searchTerm || 
      partner.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      partner.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (partner.company_name && partner.company_name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = !selectedServiceCategory || 
      (partner.service_categories && partner.service_categories.includes(selectedServiceCategory));
    
    return matchesSearch && matchesCategory;
  });

  const handleAssignProject = (partner: Partner) => {
    setSelectedPartner(partner);
    setAssignDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-2xl">Loading partners...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Partners</h1>
          <p className="text-gray-600">Manage external partners and freelancers</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Search & Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[300px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by name, email, or company..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <select
              value={selectedServiceCategory}
              onChange={(e) => setSelectedServiceCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Categories</option>
              {serviceCategories.map(category => (
                <option key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Partners Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPartners.map((partner: any) => {
          const activeProjects = partner.partner_project_assignments?.filter(
            (assignment: any) => assignment.projects?.status !== 'Completed'
          ).length || 0;

          return (
            <Card key={partner.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{partner.full_name}</CardTitle>
                    {partner.company_name && (
                      <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                        <Building className="h-3 w-3" />
                        {partner.company_name}
                      </p>
                    )}
                  </div>
                  <Badge variant="outline" className="bg-green-50 text-green-700">
                    Active
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="h-3 w-3" />
                    {partner.email}
                  </div>
                  {partner.phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="h-3 w-3" />
                      {partner.phone}
                    </div>
                  )}
                  {partner.location && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="h-3 w-3" />
                      {partner.location}
                    </div>
                  )}
                </div>

                {/* Service Categories */}
                {partner.service_categories && partner.service_categories.length > 0 && (
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Services
                    </label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {partner.service_categories.map((category: string) => (
                        <Badge key={category} variant="outline" className="text-xs">
                          {category}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Project Stats */}
                <div className="pt-3 border-t border-gray-100">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Active Projects</span>
                    <Badge variant="secondary">{activeProjects}</Badge>
                  </div>
                  <div className="flex justify-between items-center text-sm mt-1">
                    <span className="text-gray-600">Total Projects</span>
                    <Badge variant="secondary">
                      {partner.partner_project_assignments?.length || 0}
                    </Badge>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleAssignProject(partner)}
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Assign Project
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredPartners.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <UserPlus className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No partners found</h3>
            <p className="text-gray-500">
              {searchTerm || selectedServiceCategory 
                ? "Try adjusting your search filters."
                : "Partners will appear here once they register."}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Assign Partner Dialog */}
      {selectedPartner && (
        <AssignPartnerDialog
          partner={selectedPartner}
          isOpen={assignDialogOpen}
          onOpenChange={setAssignDialogOpen}
          onSuccess={() => {
            setAssignDialogOpen(false);
            setSelectedPartner(null);
          }}
        />
      )}
    </div>
  );
};

export default Partners;
