import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import coachService from '@/services/coachService';
import { CoachCard } from '@/components/coaches/CoachCard';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const CoachesList = () => {
  const [coaches, setCoaches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    coachService.getAllCoaches().then(data => {
      if (mounted) setCoaches(data || []);
    }).catch(() => {}).finally(() => mounted && setLoading(false));
    return () => { mounted = false };
  }, []);

  const allSpecializations = useMemo(() => {
    const set = new Set<string>();
    coaches.forEach(c => {
      (c.specialization || []).forEach((s: string) => set.add(s));
    });
    return Array.from(set).sort();
  }, [coaches]);

  const specCounts = useMemo(() => {
    const map = new Map<string, number>();
    coaches.forEach(c => {
      (c.specialization || []).forEach((s: string) => map.set(s, (map.get(s) || 0) + 1));
    });
    return map;
  }, [coaches]);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  const handleBook = (coach: any) => {
    const id = coach._id ?? coach.id ?? coach?.id;
    if (id) navigate(`/coaches/${id}?focus=availability`);
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return coaches.filter(c => {
      // match query
      const name = `${c.firstName || ''} ${c.lastName || ''}`.trim() || c.name || '';
      const hay = (name + ' ' + (c.title || '') + ' ' + (c.bio || '')).toLowerCase();
      if (q && !hay.includes(q)) return false;
      // match tags
      if (selectedTags.length > 0) {
        const specs = (c.specialization || []).map((s: string) => s.toLowerCase());
        return selectedTags.every(t => specs.includes(t.toLowerCase()));
      }
      return true;
    });
  }, [coaches, query, selectedTags]);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Coaches</h1>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <Input placeholder="Search coaches, specialties, titles..." value={query} onChange={e => setQuery(e.target.value)} />
        <div className="flex items-center gap-2">
          {selectedTags.length > 0 && (
            <Button variant="ghost" onClick={() => setSelectedTags([])}>Clear filters</Button>
          )}
        </div>
      </div>

      <div className="mb-4">
        <div className="flex flex-wrap gap-2">
          {allSpecializations.length === 0 && <div className="text-sm text-muted-foreground">No specializations available</div>}
          {allSpecializations.map(spec => (
            <Badge key={spec} onClick={() => toggleTag(spec)} className={`cursor-pointer ${selectedTags.includes(spec) ? 'bg-primary text-white' : ''}`}>
              {spec} {specCounts.get(spec) ? <span className="ml-1 text-xs text-muted-foreground">({specCounts.get(spec)})</span> : null}
            </Badge>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-64 p-6 bg-card rounded-lg animate-pulse">
              <div className="flex items-start space-x-4 mb-4">
                <div className="h-16 w-16 rounded-full bg-muted" />
                <div className="flex-1">
                  <div className="h-4 bg-muted rounded w-1/2 mb-2" />
                  <div className="h-3 bg-muted rounded w-1/3 mb-2" />
                </div>
              </div>
              <div className="space-y-3">
                <div className="h-3 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-2/3" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {filtered.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">No coaches found. Try adjusting search or filters.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map(c => (
                <CoachCard
                  key={c._id ?? c.id ?? Math.random()}
                  coach={{
                    id: c._id ?? c.id,
                    name: `${c.firstName || ''} ${c.lastName || ''}`.trim() || c.name || 'Coach',
                    title: c.title || c.specialization?.[0] || 'Coach',
                    specialization: c.specialization || [],
                    experience_years: c.experience_years ?? c.experience ?? 0,
                    hourly_rate: c.hourly_rate ?? c.rate ?? 0,
                    bio: c.bio || c.description || '',
                    achievements: c.achievements || [],
                    rating: c.rating ?? 0,
                    total_reviews: c.total_reviews ?? c.reviews_count ?? 0,
                    is_verified: c.is_verified ?? c.verified ?? false,
                    avatar_url: c.avatarUrl ?? c.avatar_url ?? c.avatar
                  }}
                  onBookSession={handleBook}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CoachesList;
