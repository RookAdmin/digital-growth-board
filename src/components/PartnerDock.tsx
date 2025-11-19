import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Award, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

const partnerDockItems = [
  { label: "Dashboard", href: "/partner/dashboard", icon: LayoutDashboard },
  { label: "Awards", href: "/partner/awards", icon: Award },
  { label: "Agreements", href: "/partner/agreements", icon: FileText },
];

export const PartnerDock = () => {
  const location = useLocation();

  return (
    <div className="fixed inset-x-0 bottom-8 z-40 flex justify-center px-4 pointer-events-none">
      <div className="pointer-events-auto flex items-center gap-4 rounded-[28px] border border-white/70 bg-white/90 px-6 py-3 shadow-[0_25px_90px_rgba(15,23,42,0.18)] backdrop-blur-2xl">
        {partnerDockItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href;

          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "group flex flex-col items-center gap-1 px-3 py-1 transition-all duration-200",
                isActive ? "text-gray-900" : "text-gray-500 hover:text-gray-900"
              )}
            >
              <span
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-2xl border transition-all duration-200",
                  isActive
                    ? "border-gray-900 bg-gray-900 text-white"
                    : "border-transparent bg-gray-100 text-gray-700 group-hover:border-gray-200 group-hover:bg-white"
                )}
              >
                <Icon className="h-5 w-5" />
              </span>
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

