
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export const ContactPrompt = () => {
  return (
    <section className="py-20 md:py-28 bg-white">
      <div className="container mx-auto px-4 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-extralight text-gray-900 mb-6 tracking-tight">
            Have questions before registering?
          </h2>
          <div className="w-16 h-px bg-gradient-to-r from-transparent via-gray-400 to-transparent mx-auto mb-10"></div>
          <Button variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50 font-light rounded-full px-10 py-4 text-base shadow-sm hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300" asChild>
            <Link to="/contact">
              Contact our team
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};
