
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
        <section className="py-20 md:py-32 bg-white border-t border-gray-100">
          <div className="container mx-auto px-4 text-center">
            <div className="max-w-2xl mx-auto">
              <Users className="h-10 w-10 text-gray-400 mx-auto mb-8" strokeWidth={1} />
              <h2 className="text-3xl md:text-4xl font-light text-gray-900 mb-6">
                Client Portal
              </h2>
              <p className="text-lg text-gray-600 mb-10 font-light leading-relaxed">
                Existing clients can access their dedicated portal to view project progress, 
                invoices, shared files, and communicate with our team.
              </p>
              <Button asChild className="bg-gray-900 hover:bg-gray-800 text-white font-light rounded-full px-8 py-4 text-lg">
                <Link to="/login">
                  Access Client Portal
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-12 bg-gray-50 border-t border-gray-100">
          <div className="container mx-auto text-center">
            <p className="text-gray-500 font-light text-sm tracking-wide">
              Crafted with love by Rook.
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default Index;
