
import { Hero } from "@/components/Hero";
import { About } from "@/components/About";
import { Header } from "@/components/Header";
import { ContactPrompt } from "@/components/ContactPrompt";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <Header onLightBg />
      <main>
        <Hero />
        <About />
        <ContactPrompt />
        
        {/* Footer */}
        <footer className="py-12 sm:py-16 bg-white/60 backdrop-blur-xl border-t border-white/20">
          <div className="container mx-auto px-4 sm:px-6 text-center">
            <div className="w-12 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent mx-auto mb-6"></div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 md:gap-8 text-sm text-gray-500 font-light">
              <Link to="/privacy" className="hover:text-gray-700 transition-colors px-2 py-1 rounded-lg hover:bg-white/50">
                Privacy Policy
              </Link>
              <span className="hidden sm:block text-gray-300">|</span>
              <Link to="/terms" className="hover:text-gray-700 transition-colors px-2 py-1 rounded-lg hover:bg-white/50">
                Terms of Service
              </Link>
              <span className="hidden sm:block text-gray-300">|</span>
              <span className="tracking-wide">
                © Realm by Rook Concierge
              </span>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default Index;
