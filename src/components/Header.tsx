
import { Link, useNavigate } from 'react-router-dom';
import { Rocket, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface HeaderProps {
  isAuthenticated?: boolean;
  onLightBg?: boolean;
}

export const Header = ({ isAuthenticated: _, onLightBg = false }: HeaderProps = {}) => {
  const { session } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Logged out successfully");
      navigate('/login');
    }
  };

  const navLinkClasses = onLightBg ? 'text-gray-700 hover:text-primary' : '';
  const logoutButtonClasses = onLightBg ? 'text-gray-700 border-gray-300 hover:bg-gray-100 hover:text-primary' : '';

  return (
    <header className="py-4 px-4 md:px-6 animate-fade-in border-b flex-shrink-0">
      <div className="container mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <Rocket className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold text-primary">Rook Client</span>
        </Link>
        <nav className="flex items-center gap-4">
          {session ? (
            <>
              <Button variant="ghost" asChild className={navLinkClasses}>
                <Link to="/dashboard/leads">Dashboard</Link>
              </Button>
              <Button variant="ghost" asChild className={navLinkClasses}>
                <Link to="/dashboard/clients">Clients</Link>
              </Button>
              <Button variant="ghost" asChild className={navLinkClasses}>
                <Link to="/dashboard/projects">Projects</Link>
              </Button>
              <Button variant="ghost" asChild className={navLinkClasses}>
                <Link to="/dashboard/scheduling">Scheduling</Link>
              </Button>
              <Button variant="ghost" asChild className={navLinkClasses}>
                <Link to="/dashboard/files">Files</Link>
              </Button>
              <Button variant="outline" onClick={handleLogout} className={logoutButtonClasses}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" asChild className={navLinkClasses}>
                <Link to="/login">Login</Link>
              </Button>
              <Button asChild>
                <Link to="/signup">Sign Up</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};
