import Footer from "@/components/layout/Footer";
import HeroSection from "@/components/sections/HeroSection";
import FeaturedCoaches from "@/components/sections/FeaturedCoachesUpdated";
import HowItWorks from "@/components/sections/HowItWorks";
import BlogSection from "@/components/sections/BlogSection";
import BackendTester from "@/components/BackendTesterNew";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const Index = () => {
  const location = useLocation();

  useEffect(() => {
    const hash = location.hash;
    if (hash) {
      const id = decodeURIComponent(hash.replace('#', ''));
      const scrollToEl = () => {
        const el = document.getElementById(id);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          // Optional: focus for accessibility without scrolling again
          el.setAttribute('tabindex', '-1');
          (el as HTMLElement).focus({ preventScroll: true });
        }
      };
      // Run after paint to ensure sections are mounted
      setTimeout(scrollToEl, 0);
      // In case content loads slightly later (e.g., images), retry once
      setTimeout(scrollToEl, 100);
    } else {
      // No hash -> ensure top of page when landing on home
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [location.hash]);

  return (
    
    <div className="min-h-screen bg-background">
      {import.meta.env.DEV_CODE && (
        <div className="container mx-auto px-4 pt-20">
          <BackendTester />
        </div>
      )}
  <section id="hero"><HeroSection /></section>
  <section id="coaches"><FeaturedCoaches /></section>
  <HowItWorks />
  <BlogSection />
      <Footer />
    </div>
  );
};

export default Index;
