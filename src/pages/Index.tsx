
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { About } from "@/components/About";
import { ContactPrompt } from "@/components/ContactPrompt";
import { Footer } from "@/components/Footer";
import { DockNav } from "@/components/DockNav";
import { PartnerDock } from "@/components/PartnerDock";
import { useAuth } from "@/hooks/useAuth";
import { usePartnerAuth } from "@/hooks/usePartnerAuth";

const Index = () => {
  const { session } = useAuth();
  const { partner } = usePartnerAuth();

  return (
    <div className="min-h-screen bg-white">
      <Header isAuthenticated={false} showPublicLinks={false} />
      <main className="pt-2">
        <Hero />
        <About />
        <ContactPrompt />
      </main>
      <Footer />
      {partner ? <PartnerDock /> : session && <DockNav />}
    </div>
  );
};

export default Index;
