import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star } from "lucide-react";
import { Link } from 'react-router-dom';

interface Coach {
  id: string;
  name: string;
  title?: string;
  specialization?: string[];
  experience_years?: number;
  hourly_rate?: number;
  bio?: string;
  achievements?: string[];
  rating?: number;
  total_reviews?: number;
  is_verified?: boolean;
  avatar_url?: string;
  education?: string;
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
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <Avatar className="h-16 w-16">
            {coach.avatar_url ? <AvatarImage src={coach.avatar_url} alt={coach.name} /> : <AvatarFallback className="text-lg font-semibold bg-primary/10 text-primary">{initials}</AvatarFallback>}
          </Avatar>

          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div className="min-w-0">
                <h3 className="text-lg font-semibold truncate">{coach.name}</h3>
                <p className="text-xs text-muted-foreground truncate">{coach.title}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(coach.specialization || []).slice(0,3).map((s: any) => <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>)}
                  {(coach.specialization || []).length > 3 && <Badge variant="outline" className="text-xs">+{(coach.specialization || []).length - 3} more</Badge>}
                </div>
              </div>

              <div className="text-right">
                <div className="text-base font-semibold">{coach.hourly_rate ? `$${coach.hourly_rate}` : 'Custom'}</div>
                <div className="text-xs text-muted-foreground">per session</div>
              </div>
            </div>

            <p className="mt-3 text-sm text-muted-foreground line-clamp-3">{coach.bio}</p>

            <div className="mt-3 flex items-center gap-3 text-sm">
              <div className="font-medium">{(coach.rating ?? 0).toFixed(1)}</div>
              <div className="text-xs text-muted-foreground">({coach.total_reviews ?? 0})</div>
              {coach.experience_years ? <div className="text-xs text-muted-foreground">• {coach.experience_years} yrs</div> : null}
              {coach.education ? <div className="text-xs text-muted-foreground">• {coach.education}</div> : null}
            </div>

            {coach.achievements && coach.achievements.length > 0 && (
              <div className="mt-2 text-xs text-muted-foreground">Achievements: {coach.achievements.slice(0,3).join(', ')}{coach.achievements.length > 3 ? '...' : ''}</div>
            )}
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-2">
        <div className="w-full flex gap-2">
          <Button className="flex-1" onClick={() => onBookSession?.(coach)}>Book Session</Button>
          <Link to={`/coaches/${coach.id}`} className="inline-flex items-center justify-center px-4 py-2 border rounded text-sm text-primary hover:bg-primary/5">View profile</Link>
        </div>
      </CardFooter>
    </Card>
  );
};