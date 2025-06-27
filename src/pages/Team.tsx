
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
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Team Management</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">Invite and manage your team members.</p>
          </div>
          <Button onClick={() => setInviteDialogOpen(true)} className="modern-button bg-green-600 hover:bg-green-700 w-full sm:w-auto">
            <PlusCircle className="mr-2 h-4 w-4" />
            Invite Member
          </Button>
        </div>

        {isLoading && (
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        )}
        {error && <div className="text-red-500 p-4 modern-card">Error fetching team members: {error.message}</div>}
        {teamMembers && <TeamMembersTable teamMembers={teamMembers} />}

        <InviteMemberDialog
          isOpen={isInviteDialogOpen}
          onOpenChange={setInviteDialogOpen}
          onInviteSuccess={refetch}
        />
      </div>
    </div>
  );
};

export default TeamPage;
