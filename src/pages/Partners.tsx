
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, UserPlus, Phone, Mail, Building, Award, ChevronDown } from 'lucide-react';
import { AssignPartnerDialog } from '@/components/AssignPartnerDialog';
import { AddPartnerDialog } from '@/components/AddPartnerDialog';
import { Tables } from '@/integrations/supabase/types';
import { Header } from '@/components/Header';
import { pillClasses } from '@/constants/palette';
import { DockNav } from '@/components/DockNav';
import { LoadingState } from '@/components/LoadingState';
import { PageHero } from '@/components/PageHero';
import { PARTNER_TIERS, getPartnerTier } from '@/utils/partnerTiers';
import { getCurrentFiscalYearRange, getFiscalYearRangeForDate } from '@/utils/fiscalYear';
import { FiscalYearFilter } from '@/components/FiscalYearFilter';
import { useWorkspaceId } from '@/hooks/useWorkspaceId';

type Partner = Tables<'partners'>;

const Partners = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTier, setSelectedTier] = useState<string>('all');
  const [selectedFY, setSelectedFY] = useState<string | undefined>();
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);

  useEffect(() => {
    document.title = "Partners - Rook";
  }, []);

  const workspaceId = useWorkspaceId();
  const { data: partners = [], isLoading } = useQuery({
    queryKey: ['partners', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];
      const { data, error } = await supabase
        .from('partners')
        .select(`
          *,
          partner_project_assignments (
            id,
            projects:project_id (
              id,
              name,
              status,
              budget
            )
          )
        `)
        .eq('workspace_id', workspaceId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!workspaceId,
  });

  const currentFY = getCurrentFiscalYearRange();

  const partnersWithMeta = partners.map((partner: any) => {
    const fyTotals: Record<string, { amount: number; start: number }> = {};

    partner.partner_project_assignments?.forEach((assignment: any) => {
      const project = assignment.projects;
      if (!project || project.status !== 'Completed') return;
      const budget = project.budget || 0;
      const referenceDate = project.updated_at ? new Date(project.updated_at) : new Date(project.created_at);
      const fy = getFiscalYearRangeForDate(referenceDate);
      fyTotals[fy.label] = {
        amount: (fyTotals[fy.label]?.amount || 0) + budget,
        start: fy.start.getTime(),
      };
    });

    const revenueFY = selectedFY || currentFY.label;
    const currentRevenue = fyTotals[revenueFY]?.amount || 0;

    return {
      raw: partner,
      revenue: currentRevenue,
      fyHistory: Object.entries(fyTotals)
        .map(([label, meta]) => ({
          label,
          amount: meta.amount,
          start: meta.start,
        }))
        .sort((a, b) => b.start - a.start),
      tierInfo: getPartnerTier(currentRevenue),
    };
  });

  const filteredPartners = partnersWithMeta.filter(({ raw, tierInfo }) => {
    const matchesSearch =
      !searchTerm ||
      raw.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      raw.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (raw.company_name && raw.company_name.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesTier = selectedTier === 'all' || tierInfo.tier.name === selectedTier;
    return matchesSearch && matchesTier;
  });

  const sortedPartners = filteredPartners.sort((a, b) => {
    const tierIndexA = PARTNER_TIERS.findIndex((t) => t.name === a.tierInfo.tier.name);
    const tierIndexB = PARTNER_TIERS.findIndex((t) => t.name === b.tierInfo.tier.name);
    if (tierIndexA !== tierIndexB) return tierIndexA - tierIndexB;
    return b.revenue - a.revenue;
  });

  const handleAssignProject = (partner: Partner) => {
    setSelectedPartner(partner);
    setAssignDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f7f4ef] via-[#f4f1ff] to-[#eef7ff] pb-32">
        <Header isAuthenticated={true} />
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
          <LoadingState message="Loading partners..." fullHeight />
        </main>
        <DockNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f7f4ef] via-[#f4f1ff] to-[#eef7ff] pb-32">
      <Header isAuthenticated={true} />
      
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8">
        <PageHero
          title="Partners"
          description="Curate world-class collaborators, celebrate their wins, and keep every brief on rhythm."
          actions={
            <Button
              onClick={() => setAddDialogOpen(true)}
              className="rounded-full bg-gray-900 text-white hover:bg-black"
            >
              <UserPlus className="mr-2 h-4 w-4" />
          Add Partner
        </Button>
          }
        />

        <section className="rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-[0_20px_70px_rgba(15,23,42,0.08)] backdrop-blur space-y-6">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px_220px]">
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-[0.3em] text-gray-400">Search</label>
              <div className="relative rounded-2xl border border-gray-200 bg-white px-4 py-2.5 shadow-inner shadow-white/40">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by name, email, or company"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-none bg-transparent focus-visible:ring-0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs uppercase tracking-[0.3em] text-gray-400">Tier</label>
              <div className="relative rounded-2xl border border-gray-200 bg-white px-4 py-2.5">
                <select
                  value={selectedTier}
                  onChange={(e) => setSelectedTier(e.target.value)}
                  className="w-full appearance-none bg-transparent text-sm font-medium text-gray-900 focus:outline-none"
                >
                  <option value="all">All Tiers</option>
                  {PARTNER_TIERS.map((tier) => (
                    <option key={tier.name} value={tier.name}>
                      {tier.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs uppercase tracking-[0.3em] text-gray-400">Fiscal Year</label>
              <FiscalYearFilter
                selectedFY={selectedFY}
                onFYChange={setSelectedFY}
              />
            </div>
          </div>
        </section>

      {/* Partners Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedPartners.map(({ raw: partner, revenue, tierInfo, fyHistory }) => {
          const activeProjects = partner.partner_project_assignments?.filter(
            (assignment: any) => assignment.projects?.status !== 'Completed'
          ).length || 0;
          const nextTier = tierInfo.nextTier;

          return (
            <Card key={partner.id} className="hover:-translate-y-1 hover:shadow-[0_25px_80px_rgba(15,23,42,0.12)] transition-all duration-300 border border-white/70 bg-white">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{partner.full_name}</CardTitle>
                    {partner.company_name && (
                      <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                        <Building className="h-3 w-3" />
                        {partner.company_name}
                      </p>
                    )}
                    <p className="text-xs uppercase tracking-[0.3em] text-gray-400 mt-2">
                      {tierInfo.tier.name} tier
                    </p>
                  </div>
                  <Badge className="rounded-full bg-gray-900 text-white">
                    ${revenue.toLocaleString()}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Mail className="h-3 w-3" />
                    {partner.email}
                  </div>
                  {partner.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-3 w-3" />
                      {partner.phone}
                    </div>
                  )}
                  {partner.location && (
                    <div className="flex items-center gap-2">
                      <Building className="h-3 w-3" />
                      {partner.location}
                    </div>
                  )}
                </div>

                <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 space-y-2">
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>Active Projects</span>
                    <Badge variant="secondary">{activeProjects}</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>Tier Progress</span>
                    <span>{nextTier ? `${Math.round(tierInfo.progressToNext * 100)}%` : 'Maxed'}</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-white">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#7f5dff] to-[#ff8bd8]"
                      style={{ width: `${nextTier ? tierInfo.progressToNext * 100 : 100}%` }}
                    />
                  </div>
                  {nextTier ? (
                    <p className="text-xs text-gray-500">
                      Reach ${nextTier.minRevenue.toLocaleString()} to unlock {nextTier.name}.
                    </p>
                  ) : (
                    <p className="text-xs text-gray-500">Top tier achieved.</p>
                  )}
                  </div>

                  <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Award className="h-4 w-4 text-gray-400" />
                  Rewards and communications stored in Agreements folder.
                </div>

                  {fyHistory.length > 0 && (
                    <div className="text-xs text-gray-500 space-y-1">
                      <p className="font-semibold text-gray-600">Fiscal History:</p>
                      {fyHistory.slice(0, 2).map((fy) => (
                        <p key={fy.label}>
                          {fy.label}: ${fy.amount.toLocaleString()}
                        </p>
                      ))}
                    </div>
                  )}

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
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => window.location.href = `/partners/${partner.id}`}
                  >
                    View Details
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
              {searchTerm || selectedTier !== 'all'
                ? "Try adjusting your search filters."
                : "Partners will appear here once they register."}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Add Partner Dialog */}
      <AddPartnerDialog
        isOpen={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onSuccess={() => {
          setAddDialogOpen(false);
        }}
      />

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
      </main>
      <DockNav />
    </div>
  );
};

export default Partners;
