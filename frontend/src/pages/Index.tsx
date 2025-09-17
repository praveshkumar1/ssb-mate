import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import HeroSection from "@/components/sections/HeroSection";
import FeaturedCoaches from "@/components/sections/FeaturedCoachesNew";
import HowItWorks from "@/components/sections/HowItWorks";
import BlogSection from "@/components/sections/BlogSection";
import BackendTester from "@/components/BackendTester";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 pt-20">
        <BackendTester />
      </div>
      <HeroSection />
      <FeaturedCoaches />
      <HowItWorks />
      <BlogSection />
      <Footer />
    </div>
  );
};

export default Index;
