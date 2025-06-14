
import { Code, Megaphone, Target } from "lucide-react";

const features = [
  {
    icon: <Code className="h-8 w-8 text-primary" />,
    title: "Web Development",
    description: "Crafting beautiful, high-performance websites tailored to your business needs."
  },
  {
    icon: <Megaphone className="h-8 w-8 text-primary" />,
    title: "Digital Marketing",
    description: "Driving growth through SEO, content marketing, and targeted ad campaigns."
  },
  {
    icon: <Target className="h-8 w-8 text-primary" />,
    title: "Brand Strategy",
    description: "Building strong brand identities that resonate with your target audience."
  }
];

export const About = () => {
  return (
    <section className="container mx-auto py-20 md:py-24 animate-fade-in" style={{ animationDelay: '0.4s' }}>
      <div className="grid md:grid-cols-3 gap-12 text-center">
        {features.map((feature) => (
          <div key={feature.title} className="flex flex-col items-center">
            {feature.icon}
            <h3 className="mt-4 text-xl font-bold">{feature.title}</h3>
            <p className="mt-2 text-muted-foreground">{feature.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
};
