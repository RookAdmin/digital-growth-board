
import { useEffect, useMemo, useState } from 'react';
import { usePartnerAuth } from '@/hooks/usePartnerAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Calendar, Building, User, Sparkles, Award } from 'lucide-react';
import { format } from 'date-fns';
import { PageHero } from '@/components/PageHero';
import { PartnerDock } from '@/components/PartnerDock';
import { getPartnerTier } from '@/utils/partnerTiers';
import { getCurrentFiscalYearRange, getFiscalYearRangeForDate } from '@/utils/fiscalYear';
import { LoadingState } from '@/components/LoadingState';
import { PartnerHeader } from '@/components/PartnerHeader';

interface PartnerProject {
  id: string;
  name: string;
  description: string | null;
  status: string;
  deadline: string | null;
  created_at: string;
  updated_at: string | null;
  budget: number | null;
  clients: {
    name: string;
    business_name: string | null;
  } | null;
  assigned_role: string | null;
  notes: string | null;
  assigned_at: string;
}

const PartnerDashboard = () => {
  const { partner } = usePartnerAuth();
  const [projects, setProjects] = useState<PartnerProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [revenue, setRevenue] = useState(0);
  const [showSplash, setShowSplash] = useState(false);
  const [fyHistory, setFyHistory] = useState<{ label: string; amount: number; start: number }[]>([]);
  const currentFY = getCurrentFiscalYearRange();

  useEffect(() => {
    const fetchPartnerProjects = async () => {
      if (!partner) return;

      try {
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
              updated_at,
              clients:client_id (
                name,
                business_name
              )
            )
          `)
          .eq('partner_id', partner.id);

        if (error) {
          console.error('Error fetching partner projects:', error);
        } else {
          const formattedProjects = data.map((assignment: any) => ({
            id: assignment.projects.id,
            name: assignment.projects.name,
            description: assignment.projects.description,
            status: assignment.projects.status,
            deadline: assignment.projects.deadline,
            created_at: assignment.projects.created_at,
            updated_at: assignment.projects.updated_at,
            budget: assignment.projects.budget,
            clients: assignment.projects.clients,
            assigned_role: assignment.assigned_role,
            notes: assignment.notes,
            assigned_at: assignment.assigned_at,
          }));
          setProjects(formattedProjects);

          const totals: Record<string, { amount: number; start: number }> = {};
          formattedProjects.forEach((project) => {
            if (project.status !== 'Completed') return;
            const referenceDate = project.updated_at ? new Date(project.updated_at) : new Date(project.created_at);
            const fy = getFiscalYearRangeForDate(referenceDate);
            totals[fy.label] = {
              amount: (totals[fy.label]?.amount || 0) + (project.budget || 0),
              start: fy.start.getTime(),
            };
          });

          const history = Object.entries(totals)
            .map(([label, meta]) => ({ label, amount: meta.amount, start: meta.start }))
            .sort((a, b) => b.start - a.start);
          setFyHistory(history);
          setRevenue(history.find((item) => item.label === currentFY.label)?.amount || 0);
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPartnerProjects();
  }, [partner]);

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Not Started':
        return 'bg-[#F1F1F1] text-[#131313] border border-[#E0E0E0]';
      case 'In Progress':
        return 'bg-[#131313] text-[#FAF9F6] border border-[#131313]';
      case 'Review':
        return 'bg-[#222222] text-[#FAF9F6] border border-[#222222]';
      case 'Completed':
        return 'bg-[#FAF9F6] text-[#131313] border border-[#E0E0E0]';
      default:
        return 'bg-[#F1F1F1] text-[#131313] border border-[#E0E0E0]';
    }
  };

  const activeProjects = projects.filter(p => p.status !== 'Completed').length;

  useEffect(() => {
    if (!partner) return;
    const storageKey = `realm-partner-splash-${partner.id}`;
    if (!localStorage.getItem(storageKey)) {
      setShowSplash(true);
      localStorage.setItem(storageKey, 'true');
    }
  }, [partner]);

  const tierSnapshot = useMemo(() => getPartnerTier(revenue), [revenue]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f7f4ef] via-[#f4f1ff] to-[#eef7ff] pb-32">
        <PartnerHeader />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <LoadingState message="Preparing your partner space..." fullHeight />
        </div>
        <PartnerDock />
      </div>
    );
  }

  const { tier, nextTier, progressToNext } = tierSnapshot;
  const progressPercent = nextTier ? Math.round(progressToNext * 100) : 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f7f4ef] via-[#f4f1ff] to-[#eef7ff] pb-32">
      <PartnerHeader />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <PageHero
          title={`Welcome back, ${partner?.full_name?.split(' ')[0] || 'Partner'}`}
          description="You’re in the Realm by Rook Partner Portal—your assignments, rewards, and agreements live here."
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border border-white/70 bg-white shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
              <Building className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold text-gray-900">{activeProjects}</div>
              <p className="text-xs text-gray-500 mt-1">In motion right now</p>
            </CardContent>
          </Card>
          
          <Card className="border border-white/70 bg-white shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Assignments</CardTitle>
              <User className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold text-gray-900">{projects.length}</div>
              <p className="text-xs text-gray-500 mt-1">All Realm briefs to date</p>
            </CardContent>
          </Card>

          <Card className="border border-white/70 bg-white shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Current FY Revenue</CardTitle>
              <Sparkles className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold text-gray-900">
                ${revenue.toLocaleString()}
              </div>
              <p className="text-xs text-gray-500 mt-1">{currentFY.label}</p>
            </CardContent>
          </Card>
        </div>

        <section id="awards" className="rounded-[32px] border border-white/80 bg-white shadow-[0_25px_90px_rgba(15,23,42,0.08)] p-6 space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-gray-500">Awards & Revenue Milestone</p>
              <h2 className="text-2xl font-semibold text-gray-900 mt-1">You are currently {tier.name} tier</h2>
              <p className="text-sm text-gray-600 mt-1">{tier.description}</p>
            </div>
            <Badge className="rounded-full bg-black text-white px-4 py-2 text-xs uppercase tracking-wide">
              ${tier.minRevenue.toLocaleString()}+
            </Badge>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between text-xs font-medium text-gray-500">
              <span>${revenue.toLocaleString()} earned</span>
              {nextTier ? <span>Next: {nextTier.name} (${nextTier.minRevenue.toLocaleString()})</span> : <span>Top tier unlocked</span>}
            </div>
            <div className="h-2 w-full rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#7f5dff] to-[#ff8bd8] transition-all duration-700"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-gray-400 mb-2">Rewards</p>
              <p className="text-sm text-gray-700">{tier.rewards}</p>
            </div>
            {nextTier && (
              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-gray-400 mb-2">Next Milestone</p>
                <p className="text-sm text-gray-700">
                  Unlock <span className="font-medium">{nextTier.name}</span> by reaching ${nextTier.minRevenue.toLocaleString()}.
                </p>
              </div>
            )}
            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 flex items-center gap-3">
              <Award className="h-8 w-8 text-gray-700" />
              <div>
                <p className="text-sm font-semibold text-gray-900">Track & celebrate</p>
                <p className="text-xs text-gray-500">All communications stored inside Agreements.</p>
              </div>
            </div>
          </div>

          {fyHistory.length > 0 && (
            <div className="space-y-2 rounded-2xl border border-gray-100 bg-gray-50 p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-gray-400 mb-1">Fiscal history</p>
              {fyHistory.slice(0, 3).map(({ label, amount }) => (
                <div key={label} className="flex items-center justify-between text-sm text-gray-600">
                  <span>{label}</span>
                  <span>${amount.toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section id="projects" className="rounded-[32px] border border-white/80 bg-white shadow-[0_25px_90px_rgba(15,23,42,0.08)] p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">My Assigned Projects</h2>
            <Link to="/partner/awards" className="text-sm text-gray-600 hover:text-gray-900">
              View Awards Journey →
            </Link>
          </div>
            {projects.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <Building className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No projects assigned yet</h3>
                <p className="text-gray-500">You'll see your assigned projects here once they're available.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {projects.map((project) => (
                <div key={project.id} className="rounded-2xl border border-gray-100 p-4 hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <Link
                          to={`/partner/projects/${project.id}`}
                        className="text-lg font-medium text-gray-900 hover:text-[#222222]"
                        >
                          {project.name}
                        </Link>
                        <p className="text-sm text-gray-600 mt-1">
                          Client: {project.clients?.name || 'Unknown'}
                          {project.clients?.business_name && (
                            <span className="text-gray-400"> • {project.clients.business_name}</span>
                          )}
                        </p>
                      </div>
                      <Badge className={getStatusBadgeClass(project.status)}>
                        {project.status}
                      </Badge>
                    </div>
                    
                    {project.description && (
                      <p className="text-gray-600 mb-3 line-clamp-2">{project.description}</p>
                    )}
                    
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center gap-4">
                        {project.assigned_role && (
                          <span className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            Role: {project.assigned_role}
                          </span>
                        )}
                        {project.deadline && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            Due: {format(new Date(project.deadline), 'MMM d, yyyy')}
                          </span>
                        )}
                      </div>
                      <span>
                        Assigned: {format(new Date(project.assigned_at), 'MMM d, yyyy')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
        </section>
      </div>

      <PartnerDock />

      {showSplash && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur">
          <div className="max-w-lg rounded-[32px] border border-white/60 bg-white/95 p-8 text-center shadow-[0_30px_120px_rgba(15,23,42,0.35)] animate-in fade-in duration-500">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-900 text-white">
              <Sparkles className="h-8 w-8" />
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">Welcome to Realm by Rook</h3>
            <p className="text-gray-600 mb-4">
              This partner portal is your exclusive workspace. Track progress, unlock awards, and keep agreements close.
            </p>
            <Button
              onClick={() => setShowSplash(false)}
              className="rounded-full bg-gray-900 text-white hover:bg-black"
            >
              Enter dashboard
            </Button>
      </div>
        </div>
      )}
    </div>
  );
};

export default PartnerDashboard;
