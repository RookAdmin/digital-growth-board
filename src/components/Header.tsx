
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Menu, X, User, LogOut } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { usePartnerAuth } from "@/hooks/usePartnerAuth";
import { toast } from "sonner";

interface HeaderProps {
  isAuthenticated?: boolean;
  onLightBg?: boolean;
}

export const Header = ({ isAuthenticated = false, onLightBg = false }: HeaderProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { session } = useAuth();
  const { partner } = usePartnerAuth();

  const handleSignOut = async () => {
    try {
      const userEmail = session?.user?.email || partner?.email;
      
      // Log logout attempt
      if (userEmail) {
        await supabase.from('login_audit').insert({
          email: userEmail,
          attempt_type: 'logout',
          user_agent: navigator.userAgent
        });
      }
      
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast.success("Signed out successfully");
      navigate('/');
    } catch (error) {
      console.error('Sign out error:', error);
      toast.error("Failed to sign out");
    }
  };

  const isLoggedIn = session || partner || isAuthenticated;
  const isPartner = !!partner;
  const textColor = onLightBg ? "text-gray-900" : "text-white";
  const logoTextColor = onLightBg ? "text-black" : "text-white";

  return (
    <header className={`${onLightBg ? 'bg-white border-b border-gray-200' : 'bg-black'} relative z-50`}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <span className={`text-xl font-bold tracking-tight ${logoTextColor}`}>
              Rook
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {isLoggedIn ? (
              <>
                {isPartner ? (
                  // Partner Navigation
                  <>
                    <Link 
                      to="/partner/dashboard" 
                      className={`${textColor} hover:text-gray-300 transition-colors font-medium`}
                    >
                      My Projects
                    </Link>
                  </>
                ) : (
                  // Admin Navigation
                  <>
                    <Link 
                      to="/dashboard" 
                      className={`${textColor} hover:text-gray-300 transition-colors font-medium`}
                    >
                      Dashboard
                    </Link>
                    <Link 
                      to="/clients" 
                      className={`${textColor} hover:text-gray-300 transition-colors font-medium`}
                    >
                      Clients
                    </Link>
                    <Link 
                      to="/projects" 
                      className={`${textColor} hover:text-gray-300 transition-colors font-medium`}
                    >
                      Projects
                    </Link>
                    <Link 
                      to="/partners" 
                      className={`${textColor} hover:text-gray-300 transition-colors font-medium`}
                    >
                      Partners
                    </Link>
                    <Link 
                      to="/team" 
                      className={`${textColor} hover:text-gray-300 transition-colors font-medium`}
                    >
                      Team
                    </Link>
                    <Link 
                      to="/files" 
                      className={`${textColor} hover:text-gray-300 transition-colors font-medium`}
                    >
                      Files
                    </Link>
                    <Link 
                      to="/scheduling" 
                      className={`${textColor} hover:text-gray-300 transition-colors font-medium`}
                    >
                      Scheduling
                    </Link>
                    <Link 
                      to="/reporting" 
                      className={`${textColor} hover:text-gray-300 transition-colors font-medium`}
                    >
                      Reporting
                    </Link>
                  </>
                )}
                
                {/* User Menu */}
                <div className="flex items-center space-x-4">
                  <div className={`flex items-center space-x-2 ${textColor}`}>
                    <User className="w-4 h-4" />
                    <span className="text-sm">
                      {partner ? partner.full_name : session?.user?.email}
                    </span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleSignOut}
                    className={`${textColor} hover:bg-gray-800 hover:text-white`}
                  >
                    <LogOut className="w-4 h-4" />
                  </Button>
                </div>
              </>
            ) : (
              <>
                <Link 
                  to="/login" 
                  className={`${textColor} hover:text-gray-300 transition-colors font-medium`}
                >
                  Login
                </Link>
                <Link 
                  to="/register" 
                  className={`${textColor} hover:text-gray-300 transition-colors font-medium`}
                >
                  Get Started
                </Link>
                <Link 
                  to="/partner/login" 
                  className={`${textColor} hover:text-gray-300 transition-colors font-medium`}
                >
                  Partner Login
                </Link>
              </>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            className={`md:hidden ${textColor}`}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className={`md:hidden py-4 border-t ${onLightBg ? 'border-gray-200' : 'border-gray-800'}`}>
            <nav className="flex flex-col space-y-3">
              {isLoggedIn ? (
                <>
                  {isPartner ? (
                    <Link 
                      to="/partner/dashboard" 
                      className={`${textColor} hover:text-gray-300 transition-colors font-medium py-2`}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      My Projects
                    </Link>
                  ) : (
                    <>
                      <Link 
                        to="/dashboard" 
                        className={`${textColor} hover:text-gray-300 transition-colors font-medium py-2`}
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Dashboard
                      </Link>
                      <Link 
                        to="/clients" 
                        className={`${textColor} hover:text-gray-300 transition-colors font-medium py-2`}
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Clients
                      </Link>
                      <Link 
                        to="/projects" 
                        className={`${textColor} hover:text-gray-300 transition-colors font-medium py-2`}
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Projects
                      </Link>
                      <Link 
                        to="/partners" 
                        className={`${textColor} hover:text-gray-300 transition-colors font-medium py-2`}
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Partners
                      </Link>
                      <Link 
                        to="/team" 
                        className={`${textColor} hover:text-gray-300 transition-colors font-medium py-2`}
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Team
                      </Link>
                      <Link 
                        to="/files" 
                        className={`${textColor} hover:text-gray-300 transition-colors font-medium py-2`}
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Files
                      </Link>
                      <Link 
                        to="/scheduling" 
                        className={`${textColor} hover:text-gray-300 transition-colors font-medium py-2`}
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Scheduling
                      </Link>
                      <Link 
                        to="/reporting" 
                        className={`${textColor} hover:text-gray-300 transition-colors font-medium py-2`}
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Reporting
                      </Link>
                    </>
                  )}
                  
                  <div className="pt-2 border-t border-gray-800">
                    <div className={`flex items-center space-x-2 ${textColor} py-2`}>
                      <User className="w-4 h-4" />
                      <span className="text-sm">
                        {partner ? partner.full_name : session?.user?.email}
                      </span>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => {
                        handleSignOut();
                        setIsMenuOpen(false);
                      }}
                      className={`${textColor} hover:bg-gray-800 hover:text-white w-full justify-start`}
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <Link 
                    to="/login" 
                    className={`${textColor} hover:text-gray-300 transition-colors font-medium py-2`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Login
                  </Link>
                  <Link 
                    to="/register" 
                    className={`${textColor} hover:text-gray-300 transition-colors font-medium py-2`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Get Started
                  </Link>
                  <Link 
                    to="/partner/login" 
                    className={`${textColor} hover:text-gray-300 transition-colors font-medium py-2`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Partner Login
                  </Link>
                </>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};
