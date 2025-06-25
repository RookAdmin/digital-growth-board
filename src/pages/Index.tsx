
import { Hero } from "@/components/Hero";
import { About } from "@/components/About";
import { Header } from "@/components/Header";
import { ContactPrompt } from "@/components/ContactPrompt";

const Index = () => {
  return (
    <div className="min-h-screen bg-white">
      <Header onLightBg />
      <main>
        <Hero />
        <About />
        <ContactPrompt />
        
        {/* Footer */}
        <footer className="py-16 bg-white border-t border-gray-100">
          <div className="container mx-auto text-center">
            <div className="w-12 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent mx-auto mb-6"></div>
            <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-8 text-sm text-gray-500 font-light">
              <Link to="/privacy" className="hover:text-gray-700 transition-colors">
                Privacy Policy
              </Link>
              <span className="hidden md:block text-gray-300">|</span>
              <Link to="/terms" className="hover:text-gray-700 transition-colors">
                Terms of Service
              </Link>
              <span className="hidden md:block text-gray-300">|</span>
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
