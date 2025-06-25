
import { Button } from '@/components/ui/button';
import { useClientAuth } from '@/hooks/useClientAuth';
import { LogOut, Crown } from 'lucide-react';
import { toast } from 'sonner';

export const ClientPortalHeader = () => {
  const { clientUser, signOut } = useClientAuth();

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Logged out successfully');
    }
  };

  return (
    <header className="border-b border-gray-100 bg-white shadow-sm">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Crown className="h-6 w-6 text-gray-800" strokeWidth={1.5} />
          <span className="text-xl font-light text-gray-900 tracking-wide">Realm by Rook Concierge</span>
          <span className="text-sm text-gray-500 ml-3 font-light">Client Portal</span>
        </div>
        
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600 font-light">
            Welcome, {clientUser?.email}
          </span>
          <Button 
            variant="outline" 
            onClick={handleSignOut}
            className="border-gray-300 text-gray-700 hover:bg-gray-50 font-light rounded-full"
          >
            <LogOut className="mr-2 h-4 w-4" strokeWidth={1.5} />
            Sign Out
          </Button>
        </div>
      </div>
    </header>
  );
};
