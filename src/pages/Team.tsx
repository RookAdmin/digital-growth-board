
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
    <div className="min-h-screen bg-gray-50">
      <Header isAuthenticated={true} />
      
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">Team Management</h1>
            <p className="text-sm sm:text-base lg:text-lg text-gray-600 mt-1 font-light">Invite and manage your team members.</p>
          </div>
          <Button 
            onClick={() => setInviteDialogOpen(true)} 
            className="bg-gray-900 hover:bg-gray-800 text-white rounded-xl shadow-sm h-10 sm:h-11 w-full sm:w-auto"
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Invite Member
          </Button>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          {isLoading && (
            <div className="p-6 space-y-4">
              <Skeleton className="h-12 w-full bg-gray-100" />
              <Skeleton className="h-12 w-full bg-gray-100" />
              <Skeleton className="h-12 w-full bg-gray-100" />
            </div>
          )}
          {error && (
            <div className="p-6">
              <div className="text-red-700 bg-red-50 p-4 rounded-xl border border-red-200">
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
