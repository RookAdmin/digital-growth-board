
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export const Hero = () => {
  return (
    <section className="container mx-auto flex flex-col items-center justify-center text-center py-32 md:py-48 animate-fade-in" style={{ animationDelay: '0.2s' }}>
      <div className="max-w-5xl mx-auto">
        <h1 className="text-6xl md:text-8xl font-extralight tracking-tight text-gray-900 leading-[0.9] mb-8">
          Realm by Rook
          <span className="block text-5xl md:text-7xl text-gray-600 mt-2">Concierge</span>
        </h1>
        <div className="w-24 h-px bg-gradient-to-r from-transparent via-gray-400 to-transparent mx-auto mb-8"></div>
        <p className="text-xl md:text-2xl text-gray-500 font-light leading-relaxed max-w-2xl mx-auto tracking-wide">
          A crafted client experience — made simple, modern, and premium.
        </p>
        <div className="mt-16">
          <Button size="lg" className="px-12 py-6 text-base font-light rounded-full bg-gray-900 hover:bg-gray-800 transition-all duration-500 shadow-lg hover:shadow-xl transform hover:-translate-y-1" asChild>
            <Link to="/login">Enter Concierge</Link>
          </Button>
        </div>
      </div>
    </section>
  );
};
