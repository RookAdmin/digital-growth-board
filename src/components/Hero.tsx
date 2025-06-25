
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export const Hero = () => {
  return (
    <section className="container mx-auto flex flex-col items-center justify-center text-center py-32 md:py-48 animate-fade-in" style={{ animationDelay: '0.2s' }}>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-5xl md:text-7xl font-extralight tracking-tight text-gray-900 leading-tight mb-8">
          Welcome to Your
          <span className="block text-gray-700 mt-2">Project Portal</span>
        </h1>
        <div className="w-20 h-px bg-gradient-to-r from-transparent via-gray-400 to-transparent mx-auto mb-10"></div>
        <p className="text-xl md:text-2xl text-gray-600 font-light leading-relaxed max-w-3xl mx-auto mb-4 tracking-wide">
          Access your projects, updates, and deliverables in one secure place.
        </p>
        <p className="text-lg md:text-xl text-gray-500 font-light leading-relaxed max-w-2xl mx-auto mb-16 tracking-wide">
          New client? Register and our team will reach out to start your journey.
        </p>
        <div className="flex flex-col md:flex-row items-center justify-center gap-6">
          <Button size="lg" className="px-10 py-6 text-base font-light rounded-full bg-gray-900 hover:bg-gray-800 transition-all duration-500 shadow-lg hover:shadow-xl transform hover:-translate-y-1 w-full md:w-auto" asChild>
            <Link to="/login">
              🔐 Login to View Your Project
            </Link>
          </Button>
          <Button variant="outline" size="lg" className="px-10 py-6 text-base font-light rounded-full border-gray-300 text-gray-700 hover:bg-gray-50 transition-all duration-500 shadow-lg hover:shadow-xl transform hover:-translate-y-1 w-full md:w-auto" asChild>
            <Link to="/signup">
              📝 Register a New Project
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};
