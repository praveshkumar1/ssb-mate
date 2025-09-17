import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, MapPin, Clock } from "lucide-react";

interface Coach {
  id: string;
  name: string;
  title: string;
  specialization: string[];
  experience_years: number;
  hourly_rate: number;
  bio: string;
  achievements: string[];
  rating: number;
  total_reviews: number;
  is_verified: boolean;
  avatar_url?: string;
}

interface CoachCardProps {
  coach: Coach;
  onBookSession?: (coach: Coach) => void;
}

export const CoachCard = ({ coach, onBookSession }: CoachCardProps) => {
  const initials = coach.name
    ?.split(' ')
    .map(n => n[0])
    .join('') || 'C';

  return (
    <Card className="h-full transition-shadow duration-300 hover:shadow-lg">
      <CardContent className="p-6">
        <div className="flex items-start space-x-4 mb-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={coach.avatar_url} alt={coach.name} />
            <AvatarFallback className="text-lg font-semibold bg-primary/10 text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-foreground mb-1 truncate">
              {coach.name}
            </h3>
            <p className="text-sm text-muted-foreground mb-2">{coach.title}</p>
            <div className="flex items-center space-x-1">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < Math.floor(coach.rating)
                        ? "text-yellow-400 fill-current"
                        : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">
                {coach.rating.toFixed(1)} ({coach.total_reviews} reviews)
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center text-sm text-muted-foreground">
            <Clock className="h-4 w-4 mr-2" />
            {coach.experience_years} years experience
          </div>

          <div className="flex flex-wrap gap-2">
            {coach.specialization.slice(0, 3).map((spec, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {spec}
              </Badge>
            ))}
            {coach.specialization.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{coach.specialization.length - 3} more
              </Badge>
            )}
          </div>

          <p className="text-sm text-muted-foreground line-clamp-3">
            {coach.bio}
          </p>

          <div className="flex items-center justify-between pt-3 border-t">
            <div className="text-right">
              <span className="text-2xl font-bold text-primary">
                ₹{coach.hourly_rate}
              </span>
              <span className="text-sm text-muted-foreground">/hour</span>
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-6 pt-0">
        <Button
          className="w-full"
          onClick={() => onBookSession?.(coach)}
        >
          Book Session
        </Button>
      </CardFooter>
    </Card>
  );
};