
import { Hero } from "@/components/Hero";
import { About } from "@/components/About";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Users } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-white">
      <Header onLightBg />
      <main>
        <Hero />
        <About />
        
        {/* Client Portal Section */}
        <section className="py-24 md:py-40 bg-white border-t border-gray-100">
          <div className="container mx-auto px-4 text-center">
            <div className="max-w-3xl mx-auto">
              <div className="w-20 h-20 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-10">
                <Users className="h-9 w-9 text-gray-400" strokeWidth={1} />
              </div>
              <h2 className="text-4xl md:text-5xl font-extralight text-gray-900 mb-8 tracking-tight">
                Client Portal
              </h2>
              <div className="w-16 h-px bg-gradient-to-r from-transparent via-gray-400 to-transparent mx-auto mb-10"></div>
              <p className="text-xl md:text-2xl text-gray-500 mb-12 font-light leading-relaxed tracking-wide">
                Existing clients can access their dedicated portal to view project progress, 
                invoices, shared files, and communicate with our team.
              </p>
              <Button asChild className="bg-gray-900 hover:bg-gray-800 text-white font-light rounded-full px-12 py-6 text-base shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-500">
                <Link to="/login">
                  Access Client Portal
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-16 bg-gray-50 border-t border-gray-100">
          <div className="container mx-auto text-center">
            <div className="w-12 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent mx-auto mb-6"></div>
            <p className="text-gray-400 font-light text-sm tracking-widest uppercase">
              Crafted with love by Rook.
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default Index;
