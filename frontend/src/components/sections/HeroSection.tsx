import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, Users, Award, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

const HeroSection = () => {
    const navigate = useNavigate();
  return (
  <section className="relative overflow-hidden gradient-subtle py-20 lg:py-32" aria-labelledby="hero-heading">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center max-w-4xl mx-auto">
          {/* Trust badge */}
          <Badge variant="secondary" className="mb-6 px-4 py-2 text-sm font-medium" aria-hidden>
            <Award className="h-4 w-4 mr-2" />
            Trusted by 5000+ SSB Aspirants
          </Badge>
          
          {/* Main headline */}
          <h1 id="hero-heading" className="text-4xl md:text-6xl font-bold text-foreground mb-6 animate-fade-in">
            Master Your{" "}
            <span className="gradient-primary bg-clip-text text-transparent">
              SSB Interview
            </span>{" "}
            with Expert Coaching
          </h1>
          
          {/* Subheading */}
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto animate-slide-up">
            Connect with experienced SSB coaches and mentors. Get personalized guidance, 
            practice sessions, and proven strategies to crack your SSB interview.
          </p>
          
          {/* Stats temporarily hidden */}
          {false && (
            <div className="flex flex-wrap justify-center gap-8 mb-10 animate-slide-up" role="list" aria-label="Key stats">
              <div className="flex items-center gap-2">
                <div className="flex" role="listitem" aria-hidden>
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">4.9/5 Rating</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <span className="text-sm text-muted-foreground">500+ Expert Coaches</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-success" />
                <span className="text-sm text-muted-foreground">85% Success Rate</span>
              </div>
            </div>
          )}
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up">
            <Button size="lg" variant="hero" className="px-8 py-6 text-lg" aria-label="Find your coach" onClick={() => navigate('/coaches')}> 
              Find Your Coach
            </Button>
            {/* <Button size="lg" variant="trust" className="px-8 py-6 text-lg" aria-label="Browse success stories">
              Browse Success Stories
            </Button> */}
          </div>
          
          {/* Trust indicators */}
          <div className="mt-12 pt-8 border-t border-border">
            <p className="text-sm text-muted-foreground mb-4">Trusted by aspirants from</p>
            <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
              <span className="font-semibold">NDA</span>
              <span className="font-semibold">CDS</span>
              <span className="font-semibold">AFCAT</span>
              <span className="font-semibold">Navy</span>
              <span className="font-semibold">Army</span>
              <span className="font-semibold">Air Force</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;