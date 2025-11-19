
import { useEffect } from "react";
import { Header } from '@/components/Header';
import { TeamMembersTable } from '@/components/TeamMembersTable';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DockNav } from '@/components/DockNav';
import { LoadingState } from '@/components/LoadingState';
import { PageHero } from '@/components/PageHero';

const TeamPage = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    document.title = "Team - Rook";
  }, []);

  const { data: teamMembers = [], isLoading } = useQuery({
    queryKey: ['team-members'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
  });

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['team-members'] });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f7f4ef] via-[#f4f1ff] to-[#eef7ff] pb-32">
        <Header isAuthenticated={true} />
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
          <LoadingState message="Loading team members..." fullHeight />
        </main>
        <DockNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f7f4ef] via-[#f4f1ff] to-[#eef7ff] pb-32">
      <Header isAuthenticated={true} />
      
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6">
        <PageHero
          title="Team"
          description="Keep your crew organized, informed, and instantly deployable across every initiative."
        />
        
        <section className="rounded-[32px] border border-white/80 bg-white shadow-[0_25px_90px_rgba(15,23,42,0.08)] overflow-hidden animate-in fade-in duration-500">
          <TeamMembersTable teamMembers={teamMembers} onRefresh={handleRefresh} />
        </section>
      </main>
      <DockNav />
    </div>
  );
};

export default TeamPage;
