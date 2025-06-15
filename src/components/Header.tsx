
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const navItems = [
    { label: "Dashboard", path: "/dashboard" },
    { label: "Clients", path: "/dashboard/clients" },
    { label: "Projects", path: "/dashboard/projects" },
    { label: "Invoices", path: "/dashboard/invoices" },
    { label: "Scheduling", path: "/dashboard/scheduling" },
    { label: "Files", path: "/dashboard/files" }
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="border-b bg-white">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <h1 
              className="text-2xl font-bold text-primary cursor-pointer" 
              onClick={() => navigate("/dashboard")}
            >
              Digital Growth
            </h1>
            
            {user && (
              <nav className="hidden md:flex space-x-6">
                {navItems.map((item) => (
                  <Button
                    key={item.path}
                    variant={isActive(item.path) ? "default" : "ghost"}
                    onClick={() => navigate(item.path)}
                    className="text-sm"
                  >
                    {item.label}
                  </Button>
                ))}
              </nav>
            )}
          </div>
          
          {user && (
            <div className="flex items-center space-x-4">
              <span className="text-sm text-muted-foreground">
                {user.email}
              </span>
              <Button variant="outline" onClick={handleSignOut}>
                Sign Out
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
