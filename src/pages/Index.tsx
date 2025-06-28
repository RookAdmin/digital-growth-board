
import { useEffect } from "react";
import { Hero } from "@/components/Hero";
import { About } from "@/components/About";
import { Header } from "@/components/Header";
import { ContactPrompt } from "@/components/ContactPrompt";

const Index = () => {
  useEffect(() => {
    document.title = "Home - Rook";
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <Hero />
      <About />
      <ContactPrompt />
    </div>
  );
};

export default Index;
