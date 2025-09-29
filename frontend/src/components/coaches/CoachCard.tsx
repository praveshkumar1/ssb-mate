import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, CheckCircle2, MapPin } from "lucide-react";
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
  location?: string;
}

interface CoachCardProps {
  coach: Coach;
  onBookSession?: (coach: Coach) => void;
  variant?: 'default' | 'compact';
}

export const CoachCard = ({ coach, onBookSession, variant = 'default' }: CoachCardProps) => {
  const initials = coach.name
    ?.split(' ')
    .map(n => n[0])
    .join('') || 'C';

  if (variant === 'compact') {
    return (
      <Card className="h-full transition-all duration-300 hover:shadow-md">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Avatar className="h-12 w-12 ring-1 ring-primary/10">
              {coach.avatar_url ? <AvatarImage src={coach.avatar_url} alt={coach.name} /> : <AvatarFallback className="text-sm font-semibold bg-primary/10 text-primary">{initials}</AvatarFallback>}
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold truncate">{coach.name}</h3>
                <div className="flex items-center gap-2">
                  {/* rating */}
                  <div className="flex items-center gap-1 text-xs">
                    <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">{(coach.rating ?? 0).toFixed(1)}</span>
                    <span className="text-muted-foreground">({coach.total_reviews ?? 0})</span>
                  </div>
                  {coach.hourly_rate && coach.hourly_rate > 0 ? (
                    <Badge variant="outline" className="text-[10px] py-0.5 px-1.5">₹{coach.hourly_rate}/hr</Badge>
                  ) : null}
                </div>
              </div>
              {/* skills */}
              <div className="mt-2 flex flex-wrap gap-1">
                {(coach.specialization || []).slice(0, 2).map((s: any) => (
                  <Badge key={s} variant="secondary" className="text-[10px] py-0.5 px-1.5">{s}</Badge>
                ))}
                {(coach.specialization || []).length > 2 && (
                  <Badge variant="outline" className="text-[10px] py-0.5 px-1.5">+{(coach.specialization || []).length - 2}</Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="p-3 pt-0">
          <div className="w-full flex justify-end">
            <Link to={`/coaches/${coach.id}`} className="inline-flex items-center justify-center px-3 py-1.5 border rounded text-xs text-primary hover:bg-primary/5">View profile</Link>
          </div>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="h-full transition-all duration-300 hover:shadow-xl border-l-4 border-l-primary/70">
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <Avatar className="h-16 w-16 ring-2 ring-primary/20">
            {coach.avatar_url ? <AvatarImage src={coach.avatar_url} alt={coach.name} /> : <AvatarFallback className="text-lg font-semibold bg-primary/10 text-primary">{initials}</AvatarFallback>}
          </Avatar>

          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold truncate">{coach.name}</h3>
                  {coach.is_verified && (
                    <span title="Verified mentor" aria-label="Verified mentor" className="inline-flex items-center text-green-600">
                      <CheckCircle2 className="h-4 w-4" />
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate">{coach.title}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(coach.specialization || []).slice(0,3).map((s: any) => <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>)}
                  {(coach.specialization || []).length > 3 && <Badge variant="outline" className="text-xs">+{(coach.specialization || []).length - 3} more</Badge>}
                </div>
              </div>

              <div className="text-right">
                <div className="text-base font-semibold">{coach.hourly_rate ? `₹${coach.hourly_rate}` : 'Custom'}</div>
                <div className="text-xs text-muted-foreground">per hour</div>
              </div>
            </div>

            <p className="mt-3 text-sm text-muted-foreground line-clamp-3">{coach.bio}</p>

            <div className="mt-3 flex items-center flex-wrap gap-3 text-sm">
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`h-4 w-4 ${i < Math.round(coach.rating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                ))}
                <span className="ml-1 font-medium">{(coach.rating ?? 0).toFixed(1)}</span>
                <span className="text-xs text-muted-foreground">({coach.total_reviews ?? 0})</span>
              </div>
              {coach.experience_years ? <div className="text-xs text-muted-foreground">• {coach.experience_years} yrs</div> : null}
              {coach.education ? <div className="text-xs text-muted-foreground">• {coach.education}</div> : null}
              {coach.location ? (
                <div className="text-xs text-muted-foreground inline-flex items-center gap-1">
                  • <MapPin className="h-3 w-3" /> {coach.location}
                </div>
              ) : null}
            </div>

            {coach.achievements && coach.achievements.length > 0 && (
              <div className="mt-2 text-xs text-muted-foreground">Achievements: {coach.achievements.slice(0,3).join(', ')}{coach.achievements.length > 3 ? '...' : ''}</div>
            )}
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-5 pt-2">
        <div className="w-full flex gap-2">
          <Button className="flex-1" onClick={() => onBookSession?.(coach)}>Book Session</Button>
          <Link to={`/coaches/${coach.id}`} className="inline-flex items-center justify-center px-4 py-2 border rounded text-sm text-primary hover:bg-primary/5">View profile</Link>
        </div>
      </CardFooter>
    </Card>
  );
};