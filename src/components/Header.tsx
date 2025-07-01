
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, Menu, X } from 'lucide-react';
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
    <header className="py-4 px-4 md:px-6 animate-fade-in border-b border-white/20 flex-shrink-0 bg-white/60 backdrop-blur-xl sticky top-0 z-50 shadow-lg shadow-gray-100/20">
      <div className="container mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center">
          <img 
            src="/lovable-uploads/0adac0fd-b58d-4f5f-959a-b8d6a57c5c8c.png" 
            alt="Rook Logo" 
            className="h-8 object-contain"
          />
        </Link>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-2 bg-white/40 backdrop-blur-lg rounded-full p-2 shadow-lg border border-white/30">
          {session ? (
            <>
              <Button variant="ghost" asChild className={`${navLinkClasses} font-light text-sm hover:bg-white/50 rounded-full px-4 py-2 transition-all duration-200`}>
                <Link to="/dashboard/leads">Dashboard</Link>
              </Button>
              <Button variant="ghost" asChild className={`${navLinkClasses} font-light text-sm hover:bg-white/50 rounded-full px-4 py-2 transition-all duration-200`}>
                <Link to="/dashboard/clients">Clients</Link>
              </Button>
              <Button variant="ghost" asChild className={`${navLinkClasses} font-light text-sm hover:bg-white/50 rounded-full px-4 py-2 transition-all duration-200`}>
                <Link to="/dashboard/projects">Projects</Link>
              </Button>
              <Button variant="ghost" asChild className={`${navLinkClasses} font-light text-sm hover:bg-white/50 rounded-full px-4 py-2 transition-all duration-200`}>
                <Link to="/dashboard/team">Team</Link>
              </Button>
              <Button 
                variant="outline" 
                onClick={handleLogout} 
                className="border border-green-300/50 bg-white/60 backdrop-blur-sm text-green-700 hover:bg-white/80 font-light rounded-full px-4 py-2 ml-2 shadow-md transition-all duration-300"
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
                className="border border-green-300/50 bg-white/60 backdrop-blur-sm text-green-700 hover:bg-white/80 font-light rounded-full px-4 py-2 shadow-md transition-all duration-300"
              >
                <Link to="/login">Login</Link>
              </Button>
              <Button 
                asChild 
                className="bg-green-600 hover:bg-green-700 text-white font-light rounded-full px-4 py-2 shadow-lg transition-all duration-300 ml-1"
              >
                <Link to="/register">Register</Link>
              </Button>
            </>
          )}
        </nav>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2 bg-white/50 backdrop-blur-md rounded-full border border-white/30 shadow-lg"
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
        <div className="md:hidden absolute top-full left-0 right-0 border-t border-white/20 bg-white/90 backdrop-blur-xl shadow-2xl z-50 mx-4 rounded-2xl mt-2">
          <div className="container mx-auto px-4">
            <nav className="flex flex-col gap-1 py-4">
              {session ? (
                <>
                  <Link 
                    to="/dashboard/leads" 
                    className="text-gray-600 hover:text-gray-900 font-light py-3 px-4 rounded-xl hover:bg-white/60 transition-all duration-200 text-base"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <Link 
                    to="/dashboard/clients" 
                    className="text-gray-600 hover:text-gray-900 font-light py-3 px-4 rounded-xl hover:bg-white/60 transition-all duration-200 text-base"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Clients
                  </Link>
                  <Link 
                    to="/dashboard/projects" 
                    className="text-gray-600 hover:text-gray-900 font-light py-3 px-4 rounded-xl hover:bg-white/60 transition-all duration-200 text-base"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Projects
                  </Link>
                  <Link 
                    to="/dashboard/team" 
                    className="text-gray-600 hover:text-gray-900 font-light py-3 px-4 rounded-xl hover:bg-white/60 transition-all duration-200 text-base"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Team
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                    className="text-left text-gray-600 hover:text-gray-900 font-light py-3 px-4 rounded-xl hover:bg-white/60 transition-all duration-200 text-base"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link 
                    to="/login" 
                    className="text-green-700 bg-white/70 font-light py-3 px-4 rounded-xl transition-all duration-200 text-base text-center shadow-sm"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Login
                  </Link>
                  <Link 
                    to="/register" 
                    className="bg-green-600 hover:bg-green-700 text-white font-light py-3 px-4 rounded-xl transition-all duration-200 text-base text-center shadow-lg mt-1"
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
