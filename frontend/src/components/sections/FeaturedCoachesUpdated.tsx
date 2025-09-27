import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, MapPin, Clock, Users, Video, MessageSquare, Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import { coachService } from "@/services/coachService";
import { Coach } from "@/types";

const FeaturedCoaches = () => {
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCoaches = async () => {
      try {
        setIsLoading(true);
        const data = await coachService.getVerifiedCoaches();
        setCoaches(data.slice(0, 6)); // Show only first 6 coaches
        setError(null);
      } catch (err: any) {
        console.error('Failed to fetch coaches:', err);
        setError(err.message);
        // Use fallback data when backend is unavailable
        setCoaches(fallbackCoaches);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCoaches();
  }, []);

  // Fallback data for when backend is not available
  const fallbackCoaches: Coach[] = [
    {
      id: "1",
      name: "Rajesh Kumar",
      email: "rajesh@example.com",
      role: "mentor",
      bio: "Former SSB Interviewing Officer with 15+ years experience",
  profileImageUrl: "/avatars/soldier_male.png",
      specializations: ["Psychology", "Command Tasks"],
      experience: "senior",
      certifications: ["SSB Instructor", "Psychology Specialist"],
      rating: 4.9,
      totalReviews: 147,
      hourlyRate: 2500,
      availability: ["Monday", "Wednesday", "Friday"],
      isVerified: true,
      isActive: true,
      location: "Delhi",
      createdAt: "2024-01-01T00:00:00",
      updatedAt: "2024-01-01T00:00:00"
    },
    {
      id: "2",
      name: "Priya Sharma",
      email: "priya@example.com",
      role: "mentor",
      bio: "SSB Psychology expert and former Army Officer",
  profileImageUrl: "/avatars/soldier_male.png",
      specializations: ["Psychology", "Interview Techniques"],
      experience: "experienced",
      certifications: ["Clinical Psychology", "SSB Interviewer"],
      rating: 4.8,
      totalReviews: 89,
      hourlyRate: 2000,
      availability: ["Tuesday", "Thursday", "Saturday"],
      isVerified: true,
      isActive: true,
      location: "Mumbai",
      createdAt: "2024-01-01T00:00:00",
      updatedAt: "2024-01-01T00:00:00"
    },
    {
      id: "3",
      name: "Colonel Anil Singh",
      email: "anil@example.com",
      role: "mentor",
      bio: "Retired Army Colonel with SSB Board experience",
  profileImageUrl: "/avatars/soldier_male.png",
      specializations: ["Command Tasks", "Group Discussion", "Interview"],
      experience: "senior",
      certifications: ["Defense Training", "Leadership Coach"],
      rating: 4.9,
      totalReviews: 203,
      hourlyRate: 3000,
      availability: ["Monday", "Tuesday", "Wednesday"],
      isVerified: true,
      isActive: true,
      location: "Pune",
      createdAt: "2024-01-01T00:00:00",
      updatedAt: "2024-01-01T00:00:00"
    }
  ];

  const formatCoachName = (coach: Coach): string => {
    // Handle both new format (name) and old format (firstName/lastName)
    if (coach.name) {
      return coach.name;
    }
    
    // Fallback for backend data with firstName/lastName
    const firstName = (coach as any).firstName || '';
    const lastName = (coach as any).lastName || '';
    if (firstName || lastName) {
      return `${firstName} ${lastName}`.trim();
    }
    
    return 'Unknown Coach';
  };

  const getInitials = (coach: Coach): string => {
    const name = formatCoachName(coach);
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < Math.floor(rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
        }`}
      />
    ));
  };

  if (isLoading) {
    return (
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Featured Mentors</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Connect with verified SSB experts who have helped thousands of aspirants succeed
            </p>
          </div>
          <div className="flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Featured Mentors</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Connect with verified SSB experts who have helped thousands of aspirants succeed
          </p>
        </div>

        {error && (
          <Alert className="mb-8">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Backend connection failed. Showing demo data. Error: {error}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {coaches.map((coach) => (
            <Card key={coach.id} className="group hover:shadow-xl transition-all duration-300 border-l-4 border-l-blue-600">
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="relative">
                    <Avatar className="h-20 w-20 border-4 border-white shadow-lg">
                      <AvatarImage src={coach.profileImageUrl} alt={formatCoachName(coach)} />
                      <AvatarFallback className="bg-blue-600 text-white text-lg font-semibold">
                        {getInitials(coach)}
                      </AvatarFallback>
                    </Avatar>
                    {coach.isVerified && (
                      <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{formatCoachName(coach)}</h3>
                  <p className="text-sm text-muted-foreground">{coach.bio}</p>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-1">
                    {renderStars(coach.rating)}
                    <span className="font-medium">{coach.rating}</span>
                    <span className="text-muted-foreground">({coach.totalReviews})</span>
                  </div>
                  {coach.isVerified && <Badge variant="secondary">Verified</Badge>}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Users className="h-4 w-4 mr-2" />
                    <span>{coach.specializations.join(", ")}</span>
                  </div>
                  
                  {coach.location && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4 mr-2" />
                      <span>{coach.location}</span>
                    </div>
                  )}

                  <div className="flex items-center text-sm text-muted-foreground">
                    <Clock className="h-4 w-4 mr-2" />
                    <span>
                      {coach.experienceLevel ? 
                        coach.experienceLevel.replace('_', ' ').toUpperCase() : 
                        (typeof coach.experience === 'number' ? `${coach.experience}+ years` : 'Experienced')
                      }
                    </span>
                  </div>

                  {coach.hourlyRate && (
                    <div className="text-lg font-semibold text-blue-600">
                      ₹{coach.hourlyRate}/hour
                    </div>
                  )}
                </div>

                <div className="flex space-x-2 pt-4">
                  <Button size="sm" className="flex-1" onClick={() => navigate(`/coaches/${coach.id}/?focus=availability`)}>
                    <Video className="h-4 w-4 mr-2" />
                    Book Session
                  </Button>
                  {/* Chat option removed per request */}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <Button size="lg" variant="outline" onClick={() => navigate('/coaches')}>
            View All Mentors
          </Button>
        </div>
      </div>
    </section>
  );
};

export default FeaturedCoaches;
