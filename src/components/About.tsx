
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
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-16 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <div key={index} className="text-center group">
                <div className="mb-6 flex justify-center">
                  <feature.icon className="h-8 w-8 text-gray-400 group-hover:text-gray-600 transition-colors duration-300" strokeWidth={1} />
                </div>
                <h3 className="text-xl font-medium text-gray-900 mb-4">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed font-light">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-20 md:py-32 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-light text-gray-900 mb-8">
              Built for Service. Designed with Intention.
            </h2>
            <p className="text-lg md:text-xl text-gray-600 leading-relaxed font-light">
              Realm by Rook Concierge is not just a tool — it's a statement of care. Crafted in-house by the Rook team, it brings together onboarding pipelines, scheduling, project views, and communication into one minimal yet powerful space. Clients feel clarity. Teams move faster. Everyone feels elevated.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
