import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Sidebar from '@/components/layout/Sidebar';
import { sessionService } from '@/services/sessionService';
import coachService from '@/services/coachService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CoachCard } from '@/components/coaches/CoachCard';
import { useToast } from '@/hooks/use-toast';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu } from 'lucide-react';

const DashboardSessions = () => {
  const [upcoming, setUpcoming] = useState<any[]>([]);
  const [past, setPast] = useState<any[]>([]);
  const [coaches, setCoaches] = useState<any[]>([]);
  const [query, setQuery] = useState('');
  const [searchRef, setSearchRef] = useState<HTMLInputElement | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const all = await sessionService.getAllSessions();
        const now = Date.now();
        const up = (all || []).filter(s => new Date(s.scheduledAt).getTime() >= now);
        const past = (all || []).filter(s => new Date(s.scheduledAt).getTime() < now);
        const top = await coachService.getTopRatedCoaches(10);
        if (!mounted) return;
        setUpcoming(up);
        setPast(past);
        setCoaches(top || []);
      } catch (e: any) {
        console.error('DashboardSessions error', e);
        if (e?.status === 401) return navigate('/login', { replace: true });
        toast({ title: 'Unable to load sessions', description: e?.message || 'Try again later' });
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // focus search if requested via query param
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('focus') === 'search' && searchRef) {
      searchRef.focus();
    }
  }, [searchRef]);

  const doSearch = async () => {
    try {
      const res = await coachService.searchCoaches({ query });
      setCoaches(res || []);
    } catch (e: any) {
      toast({ title: 'Search failed', description: e?.message || 'Try again' });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 flex gap-6">
        {/* Desktop sidebar */}
        <div className="hidden md:block">
          <Sidebar />
        </div>

        <main className="flex-1">
          {/* Mobile sidebar toggle (inside main so it doesn't consume a flex column) */}
          <div className="md:hidden mb-4">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="inline-flex items-center gap-2">
                  <Menu className="h-4 w-4" />
                  Menu
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-72">
                <Sidebar forceVisible />
              </SheetContent>
            </Sheet>
          </div>
          <div className="bg-card p-6 rounded shadow">
            <h2 className="text-xl font-semibold">Sessions</h2>
            <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                <section>
                  <h3 className="text-sm font-medium">Upcoming Sessions</h3>
                  {loading ? <div className="h-24 bg-muted animate-pulse mt-2 rounded" /> : (
                    <ul className="mt-2 space-y-2">
                      {upcoming.length === 0 && <li className="text-sm text-muted-foreground">No upcoming sessions</li>}
                      {upcoming.map(s => (
                        <li key={s._id} className="p-3 border rounded flex justify-between items-start">
                          <div>
                            <div className="font-bold">{s.title}</div>
                            <div className="text-sm text-muted-semibold">{s.description}</div>
                            <div className="text-xs text-muted-foreground">{new Date(s.scheduledAt).toLocaleString()}</div>
                          </div>
                          <div className="text-right">
                            <Link to={`/sessions/${s._id}`} className="text-primary">Details</Link>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                <section className="mt-6">
                  <h3 className="text-sm font-medium">Past Sessions</h3>
                  {loading ? <div className="h-20 bg-muted animate-pulse mt-2 rounded" /> : (
                    <ul className="mt-2 space-y-2">
                      {past.length === 0 && <li className="text-sm text-muted-foreground">No past sessions</li>}
                      {past.map(s => (
                        <li key={s._id} className="p-3 border rounded">
                          <div className="font-semibold">{s.title}</div>
                          <div className="text-xs text-muted-foreground">{new Date(s.scheduledAt).toLocaleString()}</div>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              </div>

              <aside className="space-y-4">
                <div className="p-3 bg-background rounded">
                  <div className="flex gap-2">
                    <Input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search coaches" ref={(el: any) => setSearchRef(el)} />
                    <Button onClick={doSearch}>Search</Button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium">Top Coaches</h4>
                    <Link to="/coaches" className="text-xs text-primary hover:underline">Find coaches</Link>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    {coaches.slice(0, 3).map(c => {
                      const id = c._id || c.id;
                      // normalize fields expected by CoachCard
                      const coach = {
                        id,
                        name: `${c.firstName || ''} ${c.lastName || ''}`.trim() || c.name || c.displayName || c.fullName || 'Coach',
                        title: c.title || (Array.isArray(c.specializations) ? c.specializations[0] : (c.specialization?.[0])) || 'SSB Mentor',
                        specialization: c.specializations || c.specialization || [],
                        experience_years: c.experience_years || c.experience || 0,
                        hourly_rate: c.hourly_rate || c.rate || c.hourlyRate || 0,
                        bio: c.bio || c.summary || '',
                        achievements: c.achievements || [],
                        rating: (c.rating ?? c.avgRating ?? 0) as number,
                        total_reviews: c.total_reviews || c.reviews || c.totalReviews || 0,
                        is_verified: c.is_verified || c.verified || c.isVerified || false,
                        avatar_url: c.avatar_url || c.avatar || c.profileImageUrl || undefined,
                      } as any;

                      return (
                        <div key={id}>
                          <CoachCard variant="compact" coach={coach} onBookSession={() => navigate(`/coaches/${id}?focus=availability`)} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardSessions;
