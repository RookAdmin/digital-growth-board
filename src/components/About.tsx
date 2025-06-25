
import { Rocket, FileText, CalendarDays } from "lucide-react";

export const About = () => {
  const features = [
    {
      icon: Rocket,
      title: "Seamless Onboarding",
      description: "Welcome clients with clarity and structure from Day 1."
    },
    {
      icon: FileText,
      title: "Transparent Project Tracking", 
      description: "Every deliverable and status update — visible in one clean view."
    },
    {
      icon: CalendarDays,
      title: "Effortless Scheduling",
      description: "Integrated meeting flows with smart reminders and calendar sync."
    }
  ];

  return (
    <div className="bg-white">
      {/* Impact Section */}
      <section className="py-24 md:py-40 bg-gradient-to-b from-white to-gray-50/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-extralight text-gray-900 mb-6 tracking-tight">
              Crafted for Excellence
            </h2>
            <div className="w-16 h-px bg-gradient-to-r from-transparent via-gray-400 to-transparent mx-auto"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-16 md:gap-20 max-w-7xl mx-auto">
            {features.map((feature, index) => (
              <div key={index} className="text-center group">
                <div className="mb-8 flex justify-center">
                  <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-gray-100 transition-all duration-300">
                    <feature.icon className="h-7 w-7 text-gray-400 group-hover:text-gray-600 transition-colors duration-300" strokeWidth={1} />
                  </div>
                </div>
                <h3 className="text-2xl font-light text-gray-900 mb-6 tracking-wide">
                  {feature.title}
                </h3>
                <p className="text-gray-500 leading-relaxed font-light text-lg">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-24 md:py-40 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-extralight text-gray-900 mb-10 tracking-tight leading-tight">
              Built for Service.
              <span className="block text-gray-600 mt-2">Designed with Intention.</span>
            </h2>
            <div className="w-20 h-px bg-gradient-to-r from-transparent via-gray-400 to-transparent mx-auto mb-12"></div>
            <p className="text-xl md:text-2xl text-gray-500 leading-relaxed font-light tracking-wide">
              Realm by Rook Concierge is not just a tool — it's a statement of care. Crafted in-house by the Rook team, it brings together onboarding pipelines, scheduling, project views, and communication into one minimal yet powerful space. 
            </p>
            <p className="text-xl md:text-2xl text-gray-500 leading-relaxed font-light tracking-wide mt-8">
              Clients feel clarity. Teams move faster. Everyone feels elevated.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
