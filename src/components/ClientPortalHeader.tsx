
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
    <header className="border-b border-white/20 bg-white/60 backdrop-blur-xl shadow-lg shadow-gray-100/20">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-white/50 backdrop-blur-md border border-white/30 shadow-lg">
          <Crown className="h-6 w-6 text-gray-800" strokeWidth={1.5} />
          <span className="text-xl font-light text-gray-900 tracking-wide">Realm by Rook Concierge</span>
          <span className="text-sm text-gray-500 ml-3 font-light border-l border-gray-200 pl-3">Client Portal</span>
        </div>
        
        <div className="flex items-center gap-4 bg-white/40 backdrop-blur-lg rounded-full p-2 shadow-lg border border-white/30">
          <span className="text-sm text-gray-600 font-light px-3">
            Welcome, {clientUser?.email}
          </span>
          <Button 
            variant="outline" 
            onClick={handleSignOut}
            className="border border-green-300/50 bg-white/60 backdrop-blur-sm text-green-700 hover:bg-white/80 font-light rounded-full px-4 py-2 shadow-md transition-all duration-300"
          >
            <LogOut className="mr-2 h-4 w-4" strokeWidth={1.5} />
            Sign Out
          </Button>
        </div>
      </div>
    </header>
  );
};
