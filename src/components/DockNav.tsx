import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  UserPlus2,
  FolderKanban,
  Handshake,
  UserCircle2,
  Folder,
  CalendarCheck,
  BarChart3,
  Receipt,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUnifiedAuth } from "@/hooks/useUnifiedAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const dockItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Clients", href: "/clients", icon: Users },
  { label: "Leads", href: "/leads", icon: UserPlus2 },
  { label: "Projects", href: "/projects", icon: FolderKanban },
  { label: "Partners", href: "/partners", icon: Handshake },
  { label: "Team", href: "/team", icon: UserCircle2 },
  { label: "Files", href: "/files", icon: Folder },
  { label: "Scheduling", href: "/scheduling", icon: CalendarCheck },
  { label: "Reporting", href: "/reporting", icon: BarChart3 },
];

const billingItem = { label: "Billing", href: "/billing", icon: Receipt };

const allowedBillingRoles = ['CEO', 'CTO / Director of Technology', 'Client Executive', 'Project Manager'];

export const DockNav = () => {
  const location = useLocation();
  const { user, userType } = useUnifiedAuth();

  // Fetch user role
  const { data: userRole } = useQuery({
    queryKey: ['userRole', user?.id],
    queryFn: async () => {
      if (!user || userType !== 'admin') return null;
      const { data } = await supabase
        .from('team_members')
        .select('role')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();
      return data?.role || null;
    },
    enabled: !!user && userType === 'admin',
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });

  // Filter dock items based on role
  const visibleItems = [...dockItems];
  if (userRole && allowedBillingRoles.includes(userRole)) {
    visibleItems.push(billingItem);
  }

  return (
    <div className="fixed inset-x-0 bottom-6 z-50 flex justify-center px-4 pointer-events-none">
      <nav className="pointer-events-auto flex items-center gap-4 rounded-[32px] border border-white/60 bg-white/90 px-6 py-3 shadow-[0_25px_70px_rgba(15,23,42,0.18)] backdrop-blur-2xl max-w-3xl w-full justify-center">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            location.pathname === item.href ||
            location.pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "group relative flex flex-col items-center gap-1 rounded-2xl px-3 py-2 transition-all duration-200",
                isActive ? "bg-[#131313] text-white" : "text-gray-500 hover:text-gray-900 hover:bg-white/80"
              )}
            >
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-2xl transition-all duration-200",
                  isActive
                    ? "bg-white/10 text-white scale-110"
                    : "bg-gray-100 text-gray-700 group-hover:bg-white group-hover:text-gray-900 group-hover:scale-110"
                )}
              >
                <Icon className="h-5 w-5" />
              </div>
              <span
                className={cn(
                  "text-[11px] font-medium tracking-wide transition-opacity duration-150",
                  isActive ? "text-white" : "text-gray-500 group-hover:text-gray-900"
                )}
              >
                {item.label}
              </span>
              {isActive && (
                <span className="absolute -bottom-1 h-1 w-1 rounded-full bg-white" />
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

