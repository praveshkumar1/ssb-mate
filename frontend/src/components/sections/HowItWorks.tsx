import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Search, Calendar, Video, Trophy, CheckCircle, ArrowRight } from "lucide-react";

const HowItWorks = () => {
  const steps = [
    {
      step: "01",
      icon: Search,
      title: "Find Your Coach",
      description: "Browse through our verified SSB experts. Filter by specialization, experience, ratings, and price to find your perfect match.",
      features: ["500+ Expert Coaches", "Detailed Profiles", "Real Reviews"]
    },
    {
      step: "02", 
      icon: Calendar,
      title: "Book Your Session",
      description: "Choose your preferred time slot and session type. Pay securely and get instant confirmation with calendar integration.",
      features: ["Flexible Scheduling", "Video/Chat Options", "Secure Payment"]
    },
    {
      step: "03",
      icon: Video,
      title: "Start Learning",
      description: "Join your personalized coaching session. Get expert guidance, practice tests, and actionable feedback to improve.",
      features: ["1-on-1 Sessions", "Practice Tests", "Instant Feedback"]
    },
    {
      step: "04",
      icon: Trophy,
      title: "Ace Your SSB",
      description: "Apply what you've learned and crack your SSB interview with confidence. Join thousands of successful candidates.",
      features: ["85% Success Rate", "Ongoing Support", "Success Stories"]
    }
  ];

  return (
    <section id="how-it-works" className="py-20 gradient-subtle scroll-mt-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4">
            How It Works
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Your Path to <span className="gradient-primary bg-clip-text text-transparent">SSB Success</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Simple, effective, and proven. Our 4-step process has helped thousands 
            of aspirants achieve their defence career dreams.
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => {
            const IconComponent = step.icon;
            return (
              <div key={step.step} className="relative">
                <Card className="shadow-card hover:shadow-elegant transition-smooth bg-card h-full">
                  <CardHeader className="text-center pb-4">
                    {/* Step Number */}
                    <div className="w-16 h-16 mx-auto mb-4 gradient-hero rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {step.step}
                    </div>
                    
                    {/* Icon */}
                    <div className="w-12 h-12 mx-auto mb-4 bg-primary/10 rounded-lg flex items-center justify-center">
                      <IconComponent className="h-6 w-6 text-primary" />
                    </div>
                    
                    <h3 className="text-xl font-semibold text-foreground mb-2">
                      {step.title}
                    </h3>
                  </CardHeader>
                  
                  <CardContent className="text-center">
                    <p className="text-muted-foreground mb-6">
                      {step.description}
                    </p>
                    
                    {/* Features */}
                    <div className="space-y-2">
                      {step.features.map((feature) => (
                        <div key={feature} className="flex items-center justify-center gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-success" />
                          <span className="text-muted-foreground">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                
                {/* Arrow connector (hidden on last item and mobile) */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                    <ArrowRight className="h-8 w-8 text-primary" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Success Stats */}
        <div className="mt-20 text-center">
          <div className="bg-card rounded-2xl p-8 shadow-card max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold text-foreground mb-8">
              Trusted Results That Speak for Themselves
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div>
                <div className="text-3xl font-bold gradient-primary bg-clip-text text-transparent mb-2">
                  5000+
                </div>
                <div className="text-sm text-muted-foreground">
                  Students Mentored
                </div>
              </div>
              <div>
                <div className="text-3xl font-bold gradient-primary bg-clip-text text-transparent mb-2">
                  85%
                </div>
                <div className="text-sm text-muted-foreground">
                  Success Rate
                </div>
              </div>
              <div>
                <div className="text-3xl font-bold gradient-primary bg-clip-text text-transparent mb-2">
                  500+
                </div>
                <div className="text-sm text-muted-foreground">
                  Expert Coaches
                </div>
              </div>
              <div>
                <div className="text-3xl font-bold gradient-primary bg-clip-text text-transparent mb-2">
                  4.9★
                </div>
                <div className="text-sm text-muted-foreground">
                  Average Rating
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;