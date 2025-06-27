
import { Button } from '@/components/ui/button';
import { useClientAuth } from '@/hooks/useClientAuth';
import { LogOut, Crown, Menu, X } from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';

export const ClientPortalHeader = () => {
  const { clientUser, signOut } = useClientAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Logged out successfully');
    }
  };

  return (
    <header className="border-b border-white/20 bg-white/60 backdrop-blur-xl shadow-lg shadow-gray-100/20 sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3 px-3 sm:px-4 py-2 rounded-2xl bg-white/50 backdrop-blur-md border border-white/30 shadow-lg">
          <Crown className="h-5 w-5 sm:h-6 sm:w-6 text-gray-800" strokeWidth={1.5} />
          <span className="text-lg sm:text-xl font-light text-gray-900 tracking-wide hidden sm:block">Realm by Rook Concierge</span>
          <span className="text-lg font-light text-gray-900 tracking-wide sm:hidden">Realm</span>
          <span className="text-xs sm:text-sm text-gray-500 font-light border-l border-gray-200 pl-2 sm:pl-3">Client Portal</span>
        </div>
        
        {/* Desktop Navigation */}
        <div className="hidden sm:flex items-center gap-4 bg-white/40 backdrop-blur-lg rounded-full p-2 shadow-lg border border-white/30">
          <span className="text-sm text-gray-600 font-light px-3 truncate max-w-48">
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

        {/* Mobile Menu Button */}
        <button
          className="sm:hidden p-2 bg-white/50 backdrop-blur-md rounded-full border border-white/30 shadow-lg"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? (
            <X className="h-5 w-5 text-gray-700" strokeWidth={1.5} />
          ) : (
            <Menu className="h-5 w-5 text-gray-700" strokeWidth={1.5} />
          )}
        </button>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="sm:hidden absolute top-full left-0 right-0 border-t border-white/20 bg-white/90 backdrop-blur-xl shadow-2xl z-50 mx-4 rounded-2xl mt-2">
          <div className="container mx-auto px-4">
            <div className="flex flex-col gap-1 py-4">
              <div className="text-gray-600 font-light py-3 px-4 text-sm border-b border-gray-200/50 mb-2">
                Welcome, {clientUser?.email}
              </div>
              <button
                onClick={() => {
                  handleSignOut();
                  setMobileMenuOpen(false);
                }}
                className="text-left text-green-700 bg-white/70 font-light py-3 px-4 rounded-xl transition-all duration-200 text-base shadow-sm"
              >
                <LogOut className="inline mr-2 h-4 w-4" strokeWidth={1.5} />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
