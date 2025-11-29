
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Menu, X, User, LogOut } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { usePartnerAuth } from "@/hooks/usePartnerAuth";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

interface HeaderProps {
  isAuthenticated?: boolean;
  onLightBg?: boolean;
  showPublicLinks?: boolean;
}

export const Header = ({
  isAuthenticated = false,
  onLightBg = false,
  showPublicLinks = true,
}: HeaderProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { session, loading: authLoading } = useAuth();
  const { partner } = usePartnerAuth();

  // Fetch current user role
  const { data: currentUserRole } = useQuery({
    queryKey: ['currentUserRole'],
    queryFn: async () => {
      if (partner) return null; // Partners don't have roles in team_members
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data } = await supabase
        .from('team_members')
        .select('role')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();
      return data?.role || null;
    },
    enabled: !!session && !partner, // Only fetch if user is authenticated and not a partner
  });

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
  const navLinkClasses =
    "text-sm font-medium text-gray-900 transition-colors hover:text-gray-950";
  const infoTextColor = "text-gray-500";
  const mobileBorderColor = onLightBg ? "border-gray-200" : "border-white/40";
  const shouldShowNavLinks = showPublicLinks && !isLoggedIn && !authLoading;

  return (
    <header
      className={`relative z-50 ${
        onLightBg ? "bg-white/80" : "bg-transparent"
      } backdrop-blur-sm`}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex w-full items-center justify-between rounded-[32px] border border-white/60 bg-white/80 px-5 py-3 shadow-[0_20px_80px_rgba(15,23,42,0.08)] backdrop-blur-2xl gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center">
              <img
                src="/clogo.png"
                alt="Rook logo"
                className="h-9 w-auto object-contain"
              />
          </Link>

          {/* Desktop Navigation */}
            <div className="hidden md:flex flex-1 justify-center">
              {shouldShowNavLinks && (
                <nav className="flex items-center space-x-6">
                  <Link to="/login" className={navLinkClasses}>
                    Login
                    </Link>
                  <Link to="/register" className={navLinkClasses}>
                    Get Started
                    </Link>
                </nav>
              )}
            </div>

            {/* User / CTA block */}
            <div className="hidden md:flex items-center gap-4 pl-6 border-l border-white/60">
              {isLoggedIn ? (
                <>
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-900 text-white text-sm font-semibold">
                      {partner
                        ? partner.full_name?.[0]?.toUpperCase()
                        : session?.user?.email?.[0]?.toUpperCase()}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-900">
                      {partner ? partner.full_name : session?.user?.email}
                    </span>
                      <span className={`text-xs ${infoTextColor}`}>
                        {partner ? "Partner" : (currentUserRole || "Admin")}
                      </span>
                    </div>
                  </div>
                  <Button 
                    variant="outline"
                    size="sm" 
                    onClick={handleSignOut}
                    className="rounded-full border-gray-300 px-4 text-gray-900 hover:bg-gray-900 hover:text-white"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </Button>
              </>
            ) : (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full border-gray-300 text-gray-900 hover:bg-gray-900 hover:text-white"
                    onClick={() => navigate('/login')}
                >
                  Login
                  </Button>
                  <Button
                    size="sm"
                    className="rounded-full bg-gray-900 text-white hover:bg-black"
                    onClick={() => navigate('/register')}
                >
                  Get Started
                  </Button>
                </div>
              )}
            </div>

          {/* Mobile Menu Button */}
            {shouldShowNavLinks && (
          <Button
            variant="ghost"
            size="sm"
                className="md:hidden text-gray-900"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        {shouldShowNavLinks && isMenuOpen && (
          <div className={`md:hidden mt-4 rounded-3xl border ${mobileBorderColor} bg-white/90 p-4 shadow-xl backdrop-blur-2xl`}>
            <nav className="flex flex-col space-y-2 text-gray-900">
                <>
                  <Link 
                    to="/login" 
                  className="rounded-2xl px-4 py-3 text-base font-medium hover:bg-gray-100"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Login
                  </Link>
                  <Link 
                    to="/register" 
                  className="rounded-2xl px-4 py-3 text-base font-medium hover:bg-gray-100"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Get Started
                  </Link>
                </>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};
