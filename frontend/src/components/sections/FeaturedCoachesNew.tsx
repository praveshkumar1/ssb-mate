import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, MapPin, Clock, Users, Video, MessageSquare, Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useVerifiedCoaches } from "@/hooks/useApi";
import { Coach } from "@/types";

const FeaturedCoaches = () => {
  const { data: coaches, isLoading, error } = useVerifiedCoaches();

  // Fallback data for when backend is not available
  const fallbackCoaches = [
    {
      id: 1,
      user: {
        id: 1,
        username: "rajesh_kumar",
        email: "rajesh@example.com",
        firstName: "Rajesh",
        lastName: "Kumar",
        bio: "Former SSB Interviewing Officer with 15+ years experience",
        profileImageUrl: "/placeholder.svg",
        createdAt: "2024-01-01T00:00:00",
        updatedAt: "2024-01-01T00:00:00",
        roles: []
      },
      specialty: "Psychology & Command Tasks",
      experience: "15+ Years",
      hourlyRate: 2500,
      availability: "Available",
      rating: 4.9,
      totalReviews: 247,
      isVerified: true,
      createdAt: "2024-01-01T00:00:00",
      updatedAt: "2024-01-01T00:00:00",
      certifications: ["SSB Expert", "Top Rated"]
    },
    {
      id: 2,
      user: {
        id: 2,
        username: "priya_singh",
        email: "priya@example.com",
        firstName: "Priya",
        lastName: "Singh",
        bio: "Defence Academy Instructor with 12+ years experience",
        profileImageUrl: "/placeholder.svg",
        createdAt: "2024-01-01T00:00:00",
        updatedAt: "2024-01-01T00:00:00",
        roles: []
      },
      specialty: "GTO & Lecturette",
      experience: "12+ Years",
      hourlyRate: 2000,
      availability: "Available",
      rating: 4.8,
      totalReviews: 189,
      isVerified: true,
      createdAt: "2024-01-01T00:00:00",
      updatedAt: "2024-01-01T00:00:00",
      certifications: ["Recommended", "High Success"]
    },
    {
      id: 3,
      user: {
        id: 3,
        username: "amit_sharma",
        email: "amit@example.com",
        firstName: "Amit",
        lastName: "Sharma",
        bio: "NDA & CDS Mentor with 18+ years experience",
        profileImageUrl: "/placeholder.svg",
        createdAt: "2024-01-01T00:00:00",
        updatedAt: "2024-01-01T00:00:00",
        roles: []
      },
      specialty: "Personal Interview & Psychology",
      experience: "18+ Years",
      hourlyRate: 3000,
      availability: "Available",
      rating: 4.9,
      totalReviews: 312,
      isVerified: true,
      createdAt: "2024-01-01T00:00:00",
      updatedAt: "2024-01-01T00:00:00",
      certifications: ["Premium", "Interview Expert"]
    }
  ];

  // Use backend data if available, otherwise use fallback
  const displayCoaches = coaches && coaches.length > 0 ? coaches : fallbackCoaches;

  const formatCoachName = (coach: Coach) => {
    return `${coach.user.firstName || ''} ${coach.user.lastName || ''}`.trim() || coach.user.username;
  };

  const getCoachInitials = (coach: Coach) => {
    const firstName = coach.user.firstName || '';
    const lastName = coach.user.lastName || '';
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`;
    }
    return coach.user.username.slice(0, 2).toUpperCase();
  };

  return (
    <section id="coaches" className="py-20 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4">
            Featured Coaches
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Learn from the <span className="gradient-primary bg-clip-text text-transparent">Best</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Our expert coaches are former SSB officers and successful candidates 
            who understand exactly what it takes to crack the SSB interview.
          </p>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading coaches...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <Alert className="mb-8">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Unable to load coaches from backend. Showing sample data. 
              Error: {error.message}
            </AlertDescription>
          </Alert>
        )}

        {/* Backend Status */}
        {!isLoading && (
          <div className="text-center mb-8">
            <Badge variant={coaches && coaches.length > 0 ? "default" : "secondary"}>
              {coaches && coaches.length > 0 ? "Live Data from Backend" : "Sample Data (Backend Offline)"}
            </Badge>
          </div>
        )}

        {/* Coaches Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {displayCoaches.map((coach) => (
            <Card key={coach.id} className="shadow-card hover:shadow-elegant transition-smooth bg-card">
              <CardHeader className="pb-4">
                {/* Coach Avatar & Basic Info */}
                <div className="flex items-start gap-4">
                  <Avatar className="w-16 h-16">
                    <AvatarImage src={coach.user.profileImageUrl} alt={formatCoachName(coach)} />
                    <AvatarFallback className="text-lg font-semibold">
                      {getCoachInitials(coach)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex flex-wrap gap-2 mb-2">
                      {coach.certifications?.map((cert) => (
                        <Badge key={cert} variant="secondary" className="text-xs">
                          {cert}
                        </Badge>
                      ))}
                      {coach.isVerified && (
                        <Badge variant="default" className="text-xs">
                          Verified
                        </Badge>
                      )}
                    </div>
                    <h3 className="font-semibold text-lg text-foreground">{formatCoachName(coach)}</h3>
                    <p className="text-sm text-muted-foreground">{coach.user.bio || coach.specialty}</p>
                  </div>
                </div>

                {/* Rating & Reviews */}
                <div className="flex items-center gap-4 pt-2">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">{coach.rating || 'N/A'}</span>
                    {coach.totalReviews && (
                      <span className="text-sm text-muted-foreground">({coach.totalReviews})</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    {coach.experience || coach.availability || 'Available'}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Specialization */}
                <div>
                  <p className="text-sm font-medium text-foreground mb-1">Specialization</p>
                  <p className="text-sm text-muted-foreground">{coach.specialty}</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 py-3 border-t border-border">
                  <div className="text-center">
                    <p className="text-lg font-semibold text-success">
                      {coach.hourlyRate ? `₹${coach.hourlyRate}` : 'TBD'}
                    </p>
                    <p className="text-xs text-muted-foreground">Per Hour</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-semibold text-foreground">
                      {coach.isVerified ? 'Verified' : 'Pending'}
                    </p>
                    <p className="text-xs text-muted-foreground">Status</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <Button size="sm" className="flex-1">
                    <Video className="h-4 w-4 mr-2" />
                    Book Session
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Message
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* View All Button */}
        <div className="text-center mt-12">
          <Button size="lg" variant="outline" className="px-8">
            <Users className="h-5 w-5 mr-2" />
            View All Coaches
          </Button>
        </div>
      </div>
    </section>
  );
};

export default FeaturedCoaches;
