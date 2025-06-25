
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export const Hero = () => {
  return (
    <section className="container mx-auto flex flex-col items-center justify-center text-center py-24 md:py-40 animate-fade-in" style={{ animationDelay: '0.2s' }}>
      <h1 className="text-5xl md:text-7xl font-light tracking-tight text-gray-900 leading-tight mb-6">
        Realm by Rook Concierge
      </h1>
      <p className="mt-4 max-w-3xl text-xl md:text-2xl text-gray-600 font-light leading-relaxed">
        A crafted client experience — made simple, modern, and premium.
      </p>
      <div className="mt-12">
        <Button size="lg" className="px-8 py-4 text-lg font-medium rounded-full bg-gray-900 hover:bg-gray-800 transition-all duration-300" asChild>
          <Link to="/login">Enter Concierge</Link>
        </Button>
      </div>
    </section>
  );
};
