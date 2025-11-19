import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  Handshake,
  UserCircle2,
  Folder,
  CalendarCheck,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";

const dockItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Clients", href: "/clients", icon: Users },
  { label: "Projects", href: "/projects", icon: FolderKanban },
  { label: "Partners", href: "/partners", icon: Handshake },
  { label: "Team", href: "/team", icon: UserCircle2 },
  { label: "Files", href: "/files", icon: Folder },
  { label: "Scheduling", href: "/scheduling", icon: CalendarCheck },
  { label: "Reporting", href: "/reporting", icon: BarChart3 },
];

export const DockNav = () => {
  const location = useLocation();

  return (
    <div className="fixed inset-x-0 bottom-6 z-50 flex justify-center px-4 pointer-events-none">
      <nav className="pointer-events-auto flex items-center gap-4 rounded-[32px] border border-white/60 bg-white/90 px-6 py-3 shadow-[0_25px_70px_rgba(15,23,42,0.18)] backdrop-blur-2xl max-w-3xl w-full justify-center">
        {dockItems.map((item) => {
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

