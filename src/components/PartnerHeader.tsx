import { Link, useLocation } from "react-router-dom";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePartnerAuth } from "@/hooks/usePartnerAuth";
import { cn } from "@/lib/utils";

const partnerNavItems = [
  { label: "Dashboard", href: "/partner/dashboard" },
  { label: "My Projects", href: "/partner/dashboard#projects" },
  { label: "Awards", href: "/partner/awards" },
  { label: "Agreements", href: "/partner/agreements" },
];

export const PartnerHeader = () => {
  const { partner, signOut } = usePartnerAuth();
  const location = useLocation();

  const initials =
    partner?.full_name
      ?.split(" ")
      .filter(Boolean)
      .map((word) => word[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "RP";

  return (
    <header className="sticky top-0 z-30 mb-6 bg-gradient-to-b from-white/90 via-white/60 to-transparent pt-6">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 rounded-[32px] border border-white/70 bg-white/85 px-5 py-3 shadow-[0_20px_80px_rgba(15,23,42,0.08)] backdrop-blur-2xl md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <Link to="/partner/dashboard" className="flex items-center gap-3">
              <img
                src="/clogo.png"
                alt="Realm by Rook"
                className="h-8 w-auto object-contain"
              />
              <span className="hidden text-xs font-semibold uppercase tracking-[0.3em] text-gray-500 sm:inline">
                Partner
              </span>
            </Link>
            <div className="flex items-center gap-2 rounded-full border border-gray-200 px-3 py-1 text-xs text-gray-600">
              <span className="font-medium text-gray-900">{partner?.full_name || "Partner"}</span>
              <span className="text-gray-400">•</span>
              <span>Realm access</span>
            </div>
          </div>

          <div className="flex flex-1 items-center justify-center gap-1 overflow-x-auto rounded-full bg-gray-50/70 px-3 py-1 text-sm text-gray-600 md:justify-start">
            {partnerNavItems.map((item) => {
              const [path, hash] = item.href.split("#");
              const isAnchor = Boolean(hash);
              const isActive = isAnchor
                ? location.pathname === path && location.hash === `#${hash}`
                : location.pathname === item.href;

              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                    isActive ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-white"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden h-10 w-10 items-center justify-center rounded-full bg-gray-900 text-sm font-semibold text-white md:flex">
              {initials}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="rounded-full border-gray-200 text-gray-900 hover:bg-gray-900 hover:text-white"
              onClick={signOut}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

