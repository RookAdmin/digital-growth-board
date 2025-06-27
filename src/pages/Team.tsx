
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { TeamMembersTable } from '@/components/TeamMembersTable';
import { InviteMemberDialog } from '@/components/InviteMemberDialog';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Tables } from '@/integrations/supabase/types';

const fetchTeamMembers = async () => {
  const { data, error } = await supabase
    .from('team_members')
    .select('*');

  if (error) {
    throw new Error(error.message);
  }
  return data as Tables<'team_members'>[];
};

const TeamPage = () => {
  const [isInviteDialogOpen, setInviteDialogOpen] = useState(false);
  const { data: teamMembers, isLoading, error, refetch } = useQuery({
    queryKey: ['teamMembers'],
    queryFn: fetchTeamMembers,
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <Header isAuthenticated={true} />
      
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">Team Management</h1>
            <p className="text-sm sm:text-base lg:text-lg text-gray-600 mt-1 font-light">Invite and manage your team members.</p>
          </div>
          <Button 
            onClick={() => setInviteDialogOpen(true)} 
            className="modern-button bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 w-full sm:w-auto h-10 sm:h-11 rounded-xl"
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Invite Member
          </Button>
        </div>

        <div className="modern-card overflow-hidden">
          {isLoading && (
            <div className="p-6 space-y-4">
              <Skeleton className="h-12 w-full bg-white/40" />
              <Skeleton className="h-12 w-full bg-white/40" />
              <Skeleton className="h-12 w-full bg-white/40" />
            </div>
          )}
          {error && (
            <div className="p-6">
              <div className="text-red-600 bg-red-50/80 backdrop-blur-sm p-4 rounded-xl border border-red-200/50">
                Error fetching team members: {error.message}
              </div>
            </div>
          )}
          {teamMembers && <TeamMembersTable teamMembers={teamMembers} />}
        </div>

        <InviteMemberDialog
          isOpen={isInviteDialogOpen}
          onOpenChange={setInviteDialogOpen}
          onInviteSuccess={refetch}
        />
      </main>
    </div>
  );
};

export default TeamPage;
