
import { Clock, MessageCircle, FolderOpen } from "lucide-react";

export const About = () => {
  const benefits = [
    {
      icon: Clock,
      title: "Real-time Updates",
      emoji: "🕒"
    },
    {
      icon: MessageCircle,
      title: "Direct Communication", 
      emoji: "💬"
    },
    {
      icon: FolderOpen,
      title: "Centralized Project Files",
      emoji: "📁"
    }
  ];

  return (
    <div className="bg-white">
      {/* About Portal Section */}
      <section className="py-20 md:py-28 bg-gray-50/50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-extralight text-gray-900 mb-8 tracking-tight">
              About This Portal
            </h2>
            <div className="w-16 h-px bg-gradient-to-r from-transparent via-gray-400 to-transparent mx-auto mb-10"></div>
            <p className="text-xl md:text-2xl text-gray-600 leading-relaxed font-light tracking-wide mb-6">
              Designed for ease, clarity, and transparency.
            </p>
            <p className="text-lg md:text-xl text-gray-500 leading-relaxed font-light tracking-wide">
              We help you stay updated on every step of your project lifecycle.
            </p>
          </div>
        </div>
      </section>

      {/* Key Benefits Section */}
      <section className="py-20 md:py-28 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-16 max-w-5xl mx-auto">
            {benefits.map((benefit, index) => (
              <div key={index} className="text-center group">
                <div className="mb-6 flex justify-center">
                  <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-gray-100 transition-all duration-300">
                    <span className="text-2xl">{benefit.emoji}</span>
                  </div>
                </div>
                <h3 className="text-lg font-light text-gray-900 tracking-wide">
                  {benefit.title}
                </h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Statement Section */}
      <section className="py-20 md:py-28 bg-gray-50/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <blockquote className="text-xl md:text-2xl text-gray-600 font-light italic leading-relaxed mb-8 tracking-wide">
              "The portal keeps me in sync with the team at every stage — it's simple and efficient."
            </blockquote>
            <p className="text-sm text-gray-500 font-light tracking-widest uppercase">
              — Happy Client
            </p>
            <div className="mt-12">
              <p className="text-base text-gray-500 font-light tracking-wide">
                Trusted by startups, agencies, and growing businesses.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
