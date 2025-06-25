
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
    <header className="py-8 px-4 md:px-6 animate-fade-in border-b border-gray-100/50 flex-shrink-0 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center gap-4">
          <Crown className="h-7 w-7 text-gray-700" strokeWidth={1.5} />
          <span className="text-2xl font-extralight text-gray-900 tracking-wide">Realm by Rook Concierge</span>
        </Link>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-10">
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
                className="border-gray-300 text-gray-700 hover:bg-gray-50 font-light rounded-full px-8 py-2"
              >
                <LogOut className="mr-2 h-4 w-4" strokeWidth={1.5} />
                Logout
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" asChild className={`${navLinkClasses} font-light text-base hover:bg-transparent`}>
                <Link to="#about">About</Link>
              </Button>
              <Button variant="ghost" asChild className={`${navLinkClasses} font-light text-base hover:bg-transparent`}>
                <Link to="/login">Login</Link>
              </Button>
              <Button 
                asChild 
                className="bg-gray-900 hover:bg-gray-800 text-white font-light rounded-full px-8 py-2"
              >
                <Link to="/signup">Sign Up</Link>
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
        <div className="md:hidden border-t border-gray-100 mt-6 pt-6 bg-white/95 backdrop-blur-sm">
          <nav className="flex flex-col gap-6">
            {session ? (
              <>
                <Link to="/dashboard/leads" className="text-gray-600 hover:text-gray-900 font-light py-2 text-lg">
                  Dashboard
                </Link>
                <Link to="/dashboard/clients" className="text-gray-600 hover:text-gray-900 font-light py-2 text-lg">
                  Clients
                </Link>
                <Link to="/dashboard/projects" className="text-gray-600 hover:text-gray-900 font-light py-2 text-lg">
                  Projects
                </Link>
                <Link to="/dashboard/team" className="text-gray-600 hover:text-gray-900 font-light py-2 text-lg">
                  Team
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-left text-gray-600 hover:text-gray-900 font-light py-2 text-lg"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="#about" className="text-gray-600 hover:text-gray-900 font-light py-2 text-lg">
                  About
                </Link>
                <Link to="/login" className="text-gray-600 hover:text-gray-900 font-light py-2 text-lg">
                  Login
                </Link>
                <Link to="/signup" className="text-gray-600 hover:text-gray-900 font-light py-2 text-lg">
                  Sign Up
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};
