import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { usePartnerAuth } from '@/hooks/usePartnerAuth';
import { PartnerHeader } from '@/components/PartnerHeader';
import { PartnerDock } from '@/components/PartnerDock';
import { PageHero } from '@/components/PageHero';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { Building, Calendar, User, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

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

const statusStyles: Record<string, string> = {
  'Not Started': 'bg-[#F1F1F1] text-[#131313] border border-[#E0E0E0]',
  'In Progress': 'bg-[#131313] text-[#FAF9F6] border border-[#131313]',
  Review: 'bg-[#222222] text-[#FAF9F6] border border-[#222222]',
  Completed: 'bg-[#FAF9F6] text-[#131313] border border-[#E0E0E0]',
};

const PartnerProjects = () => {
  const { partner } = usePartnerAuth();

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['partner-projects', partner?.id],
    queryFn: async () => {
      if (!partner?.id) return [];
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
        .eq('partner_id', partner.id)
        .order('assigned_at', { ascending: false });

      if (error) {
        console.error('Error loading partner projects', error);
        throw error;
      }

      return (data || []).map((assignment: any) => ({
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
      })) as PartnerProject[];
    },
    enabled: !!partner?.id,
  });

  const activeProjects = useMemo(
    () => projects.filter((p) => p.status !== 'Completed').length,
    [projects]
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f7f4ef] via-[#f4f1ff] to-[#eef7ff] pb-32">
      <PartnerHeader />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <PageHero
          title="My Projects"
          description="Every Realm brief that's been assigned to you lives here. Dive into the work, timelines, and notes in one view."
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border border-white/70 bg-white shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
              <Building className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold text-gray-900">{activeProjects}</div>
              <p className="text-xs text-gray-500 mt-1">Currently moving</p>
            </CardContent>
          </Card>

          <Card className="border border-white/70 bg-white shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Assignments</CardTitle>
              <User className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold text-gray-900">{projects.length}</div>
              <p className="text-xs text-gray-500 mt-1">Lifetime with Realm</p>
            </CardContent>
          </Card>
        </div>

        <section className="rounded-[32px] border border-white/80 bg-white shadow-[0_25px_90px_rgba(15,23,42,0.08)] p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Assignments</h2>
            <p className="text-sm text-gray-500">Newest first</p>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-gray-500">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Loading your projects...
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-10">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <Building className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No projects assigned yet</h3>
              <p className="text-gray-500">You’ll see briefs here as soon as they’re assigned.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {projects.map((project) => (
                <Card key={project.id} className="border border-gray-100">
                  <CardContent className="p-4 space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <Link
                          to={`/partner/projects/${project.id}`}
                          className="text-lg font-semibold text-gray-900 hover:text-gray-700"
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
                      <Badge className={statusStyles[project.status] || statusStyles['Not Started']}>
                        {project.status}
                      </Badge>
                    </div>

                    {project.description && (
                      <p className="text-sm text-gray-600 line-clamp-2">{project.description}</p>
                    )}

                    <div className="flex flex-wrap items-center justify-between text-xs text-gray-500 gap-3">
                      <div className="flex flex-wrap items-center gap-4">
                        {project.assigned_role && (
                          <span className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            Role: {project.assigned_role}
                          </span>
                        )}
                        {project.deadline && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            Due {format(new Date(project.deadline), 'MMM d, yyyy')}
                          </span>
                        )}
                      </div>
                      <span>Assigned {format(new Date(project.assigned_at), 'MMM d, yyyy')}</span>
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

export default PartnerProjects;

