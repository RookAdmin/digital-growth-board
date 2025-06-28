
import { useEffect } from "react";
import { Header } from '@/components/Header';
import { TeamMembersTable } from '@/components/TeamMembersTable';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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
      <div className="min-h-screen bg-white">
        <Header isAuthenticated={true} />
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-gray-500">Loading team members...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header isAuthenticated={true} />
      
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-black">Team</h1>
          <p className="text-sm sm:text-base lg:text-lg text-gray-600 mt-1 font-light">Manage your team members and their roles.</p>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <TeamMembersTable teamMembers={teamMembers} onRefresh={handleRefresh} />
        </div>
      </main>
    </div>
  );
};

export default TeamPage;
