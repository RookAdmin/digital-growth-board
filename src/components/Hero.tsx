
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export const Hero = () => {
  return (
    <section className="container mx-auto flex flex-col items-center justify-center text-center py-20 md:py-32 animate-fade-in" style={{ animationDelay: '0.2s' }}>
      <h1 className="text-4xl md:text-6xl font-extrabold tracking-tighter text-primary leading-tight">
        Welcome to Rook Client
      </h1>
      <p className="mt-4 max-w-2xl text-lg text-gray-600">
        Rook Client is your partner in achieving digital excellence. We specialize in web development and strategic marketing to elevate your brand.
      </p>
      <div className="mt-8 flex gap-4">
        <Button size="lg" asChild>
          <Link to="/dashboard/leads">Get Started</Link>
        </Button>
        <Button size="lg" variant="outline">
          Learn More
        </Button>
      </div>
    </section>
  );
};
