import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { usePartnerAuth } from '@/hooks/usePartnerAuth';
import { PartnerHeader } from '@/components/PartnerHeader';
import { PartnerDock } from '@/components/PartnerDock';
import { PageHero } from '@/components/PageHero';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Loader2, Phone, Mail, Users, Activity, StickyNote } from 'lucide-react';
import { LeadStatus } from '@/types';

interface PartnerLead {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  business_name: string | null;
  services_interested: string[] | null;
  budget_range: string | null;
  lead_source: string | null;
  notes: string | null;
  status: LeadStatus;
  created_at: string;
}

const sanitizePhoneNumber = (value?: string | null) => {
  if (!value) return null;
  return value.replace(/[\s\-()]/g, '');
};

const statusColors: Record<LeadStatus, string> = {
  New: 'bg-blue-50 text-blue-700 border border-blue-100',
  Contacted: 'bg-purple-50 text-purple-700 border border-purple-100',
  Qualified: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
  'Proposal Sent': 'bg-orange-50 text-orange-700 border border-orange-100',
  Approvals: 'bg-amber-50 text-amber-700 border border-amber-100',
  Converted: 'bg-slate-900 text-white border border-slate-900',
  Dropped: 'bg-gray-100 text-gray-500 border border-gray-200',
};

const PartnerLeads = () => {
  const { partner } = usePartnerAuth();
  const sanitizedPartnerPhone = useMemo(() => sanitizePhoneNumber(partner?.phone), [partner?.phone]);

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ['partner-leads', partner?.id],
    queryFn: async () => {
      if (!partner) return [];

      const filters: string[] = [];
      if (partner.id) {
        filters.push(`partner_id.eq.${partner.id}`);
      }
      if (partner.email) {
        filters.push(`email.ilike.${partner.email}`);
      }
      if (sanitizedPartnerPhone) {
        filters.push(`phone.eq.${sanitizedPartnerPhone}`);
      }

      const query = supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters.length > 0) {
        query.or(filters.join(','));
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error loading partner leads', error);
        throw error;
      }

      return (data || []) as PartnerLead[];
    },
    enabled: !!partner?.id,
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f7f4ef] via-[#f4f1ff] to-[#eef7ff] pb-32">
      <PartnerHeader />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <PageHero
          title="Warm Leads"
          description="Any Realm inquiry that shares your contact info or has been explicitly assigned to you shows up here. Follow up, log context, and keep things moving."
        />

        <Card className="border border-white/70 bg-white shadow-md">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500">Overview</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Total Leads</p>
              <p className="text-2xl font-semibold text-gray-900">{leads.length}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-gray-400">New</p>
              <p className="text-2xl font-semibold text-gray-900">
                {leads.filter((lead) => lead.status === 'New').length}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Contacted</p>
              <p className="text-2xl font-semibold text-gray-900">
                {leads.filter((lead) => lead.status === 'Contacted').length}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Converted</p>
              <p className="text-2xl font-semibold text-gray-900">
                {leads.filter((lead) => lead.status === 'Converted').length}
              </p>
            </div>
          </CardContent>
        </Card>

        <section className="rounded-[32px] border border-white/80 bg-white shadow-[0_25px_90px_rgba(15,23,42,0.08)] p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Lead Inbox</h2>
            <p className="text-sm text-gray-500">Newest first</p>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-gray-500">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Loading leads...
            </div>
          ) : leads.length === 0 ? (
            <div className="text-center py-10">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <Users className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No leads assigned yet</h3>
              <p className="text-gray-500">When a lead uses your contact details—or we assign one manually—it will appear here.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {leads.map((lead) => (
                <Card key={lead.id} className="border border-gray-100">
                  <CardContent className="p-4 space-y-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{lead.name}</h3>
                        <p className="text-sm text-gray-500">
                          Added {format(new Date(lead.created_at), 'MMM d, yyyy')}
                        </p>
                      </div>
                      <Badge className={statusColors[lead.status] || statusColors.New}>{lead.status}</Badge>
                    </div>

                    <div className="grid gap-3 text-sm text-gray-600 md:grid-cols-3">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <a href={`mailto:${lead.email}`} className="hover:underline">
                          {lead.email}
                        </a>
                      </div>
                      {lead.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-gray-400" />
                          <a href={`tel:${lead.phone}`} className="hover:underline">
                            {lead.phone}
                          </a>
                        </div>
                      )}
                      {lead.business_name && (
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-gray-400" />
                          <span>{lead.business_name}</span>
                        </div>
                      )}
                    </div>

                    {lead.notes && (
                      <div className="flex items-start gap-2 rounded-xl bg-gray-50 p-3 text-sm text-gray-600">
                        <StickyNote className="h-4 w-4 text-gray-400 mt-0.5" />
                        <p>{lead.notes}</p>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                      {lead.services_interested && lead.services_interested.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {lead.services_interested.map((service) => (
                            <Badge key={service} variant="secondary" className="bg-gray-100 text-gray-700">
                              {service}
                            </Badge>
                          ))}
                        </div>
                      )}
                      {lead.lead_source && (
                        <span className="flex items-center gap-1">
                          <Activity className="h-3 w-3" />
                          Source: {lead.lead_source}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>

      <PartnerDock />
    </div>
  );
};

export default PartnerLeads;

