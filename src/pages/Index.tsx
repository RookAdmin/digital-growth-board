
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { About } from "@/components/About";
import { ContactPrompt } from "@/components/ContactPrompt";
import { AddLeadDialog } from "@/components/AddLeadDialog";

const Index = () => {
  return (
    <div className="min-h-screen bg-white">
      <Header isAuthenticated={false} />
      <main>
        <Hero />
        <div className="flex justify-center py-8">
          <AddLeadDialog />
        </div>
        <About />
        <ContactPrompt />
      </main>
    </div>
  );
};

export default Index;
