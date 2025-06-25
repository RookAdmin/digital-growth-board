
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Rocket } from "lucide-react";

interface HeaderProps {
  isAuthenticated?: boolean;
  onLightBg?: boolean;
}

export const Header = ({ isAuthenticated, onLightBg }: HeaderProps) => {
  return (
    <header className="border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <Rocket className="h-6 w-6 text-primary" />
          <span className="font-bold text-xl text-primary">StellarGrowth</span>
        </Link>
        
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost">
            <Link to="/about">About</Link>
          </Button>
          <Button asChild className="text-white">
            <Link to="/login">Login</Link>
          </Button>
        </div>
      </div>
    </header>
  );
};
