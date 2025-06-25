
import { Link, useNavigate } from 'react-router-dom';
import { Crown, LogOut, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useState } from 'react';

interface HeaderProps {
  isAuthenticated?: boolean;
  onLightBg?: boolean;
}

export const Header = ({ isAuthenticated: _, onLightBg = false }: HeaderProps = {}) => {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Logged out successfully");
      navigate('/login');
    }
  };

  const navLinkClasses = onLightBg ? 'text-gray-600 hover:text-gray-900' : 'text-gray-600 hover:text-gray-900';

  return (
    <header className="py-6 px-4 md:px-6 animate-fade-in border-b border-gray-100/50 flex-shrink-0 bg-white/90 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <Crown className="h-6 w-6 text-gray-800" strokeWidth={1.5} />
          <span className="text-xl font-light text-gray-900 tracking-wide">Realm by Rook Concierge</span>
        </Link>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          {session ? (
            <>
              <Button variant="ghost" asChild className={`${navLinkClasses} font-light text-base hover:bg-transparent`}>
                <Link to="/dashboard/leads">Dashboard</Link>
              </Button>
              <Button variant="ghost" asChild className={`${navLinkClasses} font-light text-base hover:bg-transparent`}>
                <Link to="/dashboard/clients">Clients</Link>
              </Button>
              <Button variant="ghost" asChild className={`${navLinkClasses} font-light text-base hover:bg-transparent`}>
                <Link to="/dashboard/projects">Projects</Link>
              </Button>
              <Button variant="ghost" asChild className={`${navLinkClasses} font-light text-base hover:bg-transparent`}>
                <Link to="/dashboard/team">Team</Link>
              </Button>
              <Button 
                variant="outline" 
                onClick={handleLogout} 
                className="border-green-300 text-green-700 hover:bg-green-50 font-light rounded-full px-6 py-2"
              >
                <LogOut className="mr-2 h-4 w-4" strokeWidth={1.5} />
                Logout
              </Button>
            </>
          ) : (
            <>
              <Button 
                variant="outline" 
                asChild 
                className="border-green-300 text-green-700 hover:bg-green-50 font-light rounded-full px-6 py-2"
              >
                <Link to="/login">Login</Link>
              </Button>
              <Button 
                asChild 
                className="bg-green-600 hover:bg-green-700 text-white font-light rounded-full px-6 py-2"
              >
                <Link to="/signup">Register</Link>
              </Button>
            </>
          )}
        </nav>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? (
            <X className="h-6 w-6 text-gray-700" strokeWidth={1.5} />
          ) : (
            <Menu className="h-6 w-6 text-gray-700" strokeWidth={1.5} />
          )}
        </button>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 border-t border-gray-100 bg-white/95 backdrop-blur-sm shadow-lg z-50">
          <div className="container mx-auto px-4">
            <nav className="flex flex-col gap-2 py-4">
              {session ? (
                <>
                  <Link 
                    to="/dashboard/leads" 
                    className="text-gray-600 hover:text-gray-900 font-light py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors text-lg"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <Link 
                    to="/dashboard/clients" 
                    className="text-gray-600 hover:text-gray-900 font-light py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors text-lg"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Clients
                  </Link>
                  <Link 
                    to="/dashboard/projects" 
                    className="text-gray-600 hover:text-gray-900 font-light py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors text-lg"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Projects
                  </Link>
                  <Link 
                    to="/dashboard/team" 
                    className="text-gray-600 hover:text-gray-900 font-light py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors text-lg"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Team
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                    className="text-left text-gray-600 hover:text-gray-900 font-light py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors text-lg"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link 
                    to="/login" 
                    className="text-gray-600 hover:text-gray-900 font-light py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors text-lg"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Login
                  </Link>
                  <Link 
                    to="/signup" 
                    className="bg-green-600 hover:bg-green-700 text-white font-light py-3 px-4 rounded-lg transition-colors text-lg text-center"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Register
                  </Link>
                </>
              )}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
};
