
import { Button } from '@/components/ui/button';
import { useClientAuth } from '@/hooks/useClientAuth';
import { LogOut, Menu, X } from 'lucide-react';
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
    <header className="border-b border-gray-200 bg-white shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center px-3 sm:px-4 py-2 rounded-xl bg-gray-50 border border-gray-200">
          <img 
            src="/lovable-uploads/0adac0fd-b58d-4f5f-959a-b8d6a57c5c8c.png" 
            alt="Realm | Concierge By Rook" 
            className="h-6 sm:h-7 object-contain"
          />
          <span className="text-xs sm:text-sm text-gray-500 font-light border-l border-gray-200 pl-2 sm:pl-3 ml-2 sm:ml-3">Client Portal</span>
        </div>
        
        {/* Desktop Navigation */}
        <div className="hidden sm:flex items-center gap-4 bg-gray-50 rounded-xl p-2 border border-gray-200">
          <span className="text-sm text-gray-600 font-light px-3 truncate max-w-48">
            Welcome, {clientUser?.email}
          </span>
          <Button 
            variant="outline" 
            onClick={handleSignOut}
            className="bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 font-light rounded-xl px-4 py-2 shadow-sm"
          >
            <LogOut className="mr-2 h-4 w-4" strokeWidth={1.5} />
            Sign Out
          </Button>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="sm:hidden p-2 bg-gray-50 rounded-xl border border-gray-200"
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
        <div className="sm:hidden absolute top-full left-0 right-0 border-t border-gray-200 bg-white shadow-lg z-50 mx-4 rounded-xl mt-2 border">
          <div className="container mx-auto px-4">
            <div className="flex flex-col gap-1 py-4">
              <div className="text-gray-600 font-light py-3 px-4 text-sm border-b border-gray-200 mb-2">
                Welcome, {clientUser?.email}
              </div>
              <button
                onClick={() => {
                  handleSignOut();
                  setMobileMenuOpen(false);
                }}
                className="text-left text-gray-700 bg-gray-50 font-light py-3 px-4 rounded-xl transition-all duration-200 text-base hover:bg-gray-100"
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
