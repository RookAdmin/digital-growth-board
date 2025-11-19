
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { About } from "@/components/About";
import { ContactPrompt } from "@/components/ContactPrompt";
import { Footer } from "@/components/Footer";
import { DockNav } from "@/components/DockNav";
import { useAuth } from "@/hooks/useAuth";

const Index = () => {
  const { session } = useAuth();

  return (
    <div className="min-h-screen bg-white">
      <Header isAuthenticated={false} showPublicLinks={false} />
      <main className="pt-2">
        <Hero />
        <About />
        <ContactPrompt />
      </main>
      <Footer />
      {session && <DockNav />}
    </div>
  );
};

export default Index;
