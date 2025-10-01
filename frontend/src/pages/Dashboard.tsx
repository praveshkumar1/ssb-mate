import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Sidebar from '@/components/layout/Sidebar';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu } from 'lucide-react';
import Spinner from '@/components/ui/Spinner';
import { apiClient } from '@/services/api';
import { sessionService } from '@/services/sessionService';
import { useToast } from '@/hooks/use-toast';
import TagInput from '@/components/ui/TagInput';

const renderPerson = (p: any) => {
  if (!p) return '';
  if (typeof p === 'string') return p;
  if (typeof p === 'object') {
    if ('name' in p && p.name) return String(p.name);
    if ((p.firstName || p.lastName) && (p.firstName || p.lastName).length > 0) return `${p.firstName || ''} ${p.lastName || ''}`.trim();
    if (p.email) return String(p.email);
    if (p.id) return String(p.id);
    if (p._id) return String(p._id);
    try { return String(p.toString()); } catch (e) { return '' + p; }
  }
  return String(p);
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [profile, setProfile] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  // quick edit removed
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [avatarPulseKey, setAvatarPulseKey] = useState(0);
  // inline editing removed - users should use Edit Profile page or Quick Edit modal

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const profRaw = await apiClient.get<any>('/users/profile');
        const prof = profRaw?.data ?? profRaw;
        if (prof && !prof._id && (prof.id || prof._id)) prof._id = prof._id || prof.id;
        const s = await sessionService.getAllSessions();
        if (!mounted) return;
        setProfile(prof ?? null);
        setSessions(s ?? []);
        if (prof?.role === 'mentor') {
          try {
            const st: any = await apiClient.get('/users/stats');
            setStats(st?.data ?? st);
          } catch (e) {
            console.warn('Could not fetch stats', e);
          }
        }
      } catch (err: any) {
        console.error('Dashboard fetch error', err);
        if (err?.status === 401) { navigate('/login', { replace: true }); return; }
        toast({ title: 'Failed to load dashboard', description: err?.message || 'An unexpected error occurred' });
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [navigate, toast]);

  const isMentor = profile?.role === 'mentor';

  // derive mentor upcoming/past
  const mentorSessions = () => {
    if (!isMentor || !profile?._id) return { upcoming: [], past: [] };
    const now = Date.now();
    const mentorAll = sessions.filter(s => {
      const m = s.mentorId;
      const mid = m && typeof m === 'object' ? (m.id || m._id || (m.toString ? m.toString() : null)) : m;
      return String(mid) === String(profile._id);
    });
    return {
      upcoming: mentorAll.filter((s: any) => new Date(s.scheduledAt).getTime() >= now),
      past: mentorAll.filter((s: any) => new Date(s.scheduledAt).getTime() < now),
    };
  };

  const mentor = mentorSessions();

  // Small star rating display
  const StarRating: React.FC<{ value: number }> = ({ value }) => {
    const full = Math.floor(value);
    const half = value - full >= 0.5;
    const stars = [] as React.ReactNode[];
    for (let i = 0; i < 5; i++) {
      if (i < full) stars.push(<span key={i} className="text-yellow-500">★</span>);
      else if (i === full && half) stars.push(<span key={i} className="text-yellow-500">☆</span>);
      else stars.push(<span key={i} className="text-muted-foreground">☆</span>);
    }
    return <div className="text-xl">{stars}</div>;
  };

  // Rate card for mentors - allows editing hourlyRate inline with save/cancel
  const RateCard: React.FC<{ profile: any; setProfile: (p: any) => void }> = ({ profile, setProfile }) => {
    const [editing, setEditing] = useState(false);
    const [value, setValue] = useState<string>(profile?.hourlyRate ? String(profile.hourlyRate) : '');
    const [saving, setSaving] = useState(false);

    useEffect(() => { setValue(profile?.hourlyRate ? String(profile.hourlyRate) : ''); }, [profile?.hourlyRate]);

    const save = async () => {
      setSaving(true);
      try {
        const resp: any = await apiClient.put('/users/profile', { hourlyRate: value ? Number(value) : null });
        const updated = resp?.data ?? resp;
        setProfile(updated);
        setEditing(false);
      } catch (e) {
        console.error('Failed to save rate', e);
      } finally { setSaving(false); }
    };

    return (
      <div className="p-4 bg-background rounded shadow-sm">
        <h3 className="text-sm font-medium">Rate</h3>
        <div className="mt-2">
          {editing ? (
            <div className="flex items-center gap-2 justify-between">
              <input className="w-24 p-1 border rounded" value={value} onChange={e => setValue(e.target.value)} />
              <div className="flex gap-2">
                <button className="text-sm text-green-600" onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
                <button className="text-sm text-red-500" onClick={() => { setEditing(false); setValue(profile?.hourlyRate ? String(profile.hourlyRate) : ''); }}>Cancel</button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="text-lg font-semibold">{profile?.hourlyRate ? `₹${profile.hourlyRate}` : 'Not set'}</div>
              <button className="text-sm text-muted-foreground" onClick={() => setEditing(true)}>Edit</button>
            </div>
          )}
        </div>
      </div>
    );
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
            <h2 className="text-xl font-semibold">{isMentor ? 'Mentor Dashboard' : `Welcome${profile?.firstName ? `, ${profile.firstName}` : ''}`}</h2>
            <p className="text-sm text-muted-foreground">Quick view of your account. Complete your profile to get the most out of the platform.</p>

            <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left column: main actions / upcoming */}
              <div className="space-y-4">
                <div className="p-4 bg-background rounded shadow-sm">
                  <h3 className="text-sm font-medium">Upcoming Sessions</h3>
                  {loading ? (
                    <div className="h-24 bg-muted animate-pulse mt-2 rounded" />
                  ) : (
                    ((isMentor ? mentor.upcoming : sessions) || []).length ? (
                      <ul className="mt-2 space-y-3">
                        {((isMentor ? mentor.upcoming : sessions) || []).slice(0, 5).map((s: any) => (
                          <li key={s._id || s.id} className="p-3 border rounded flex items-center justify-between">
                            <div>
                              <div className="font-bold">{s.title}</div>
                              <div className="text-xs text-muted-foreground">{new Date(s.scheduledAt).toLocaleString()}</div>
                              <div className="text-sm text-muted-foreground">{renderPerson(s.menteeName || s.mentee || s.menteeId)}</div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              {s.meetingLink && (
                                <a href={s.meetingLink} target="_blank" rel="noopener noreferrer" className="text-white bg-primary px-3 py-1 rounded">Start</a>
                              )}
                              <Link to={`/sessions/${s._id || s.id}`} className="text-primary">Details</Link>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="mt-3 text-sm text-muted-foreground">
                        {isMentor ? 'No upcoming sessions yet. Share your availability to start getting bookings.' : 'No upcoming sessions yet. Book a session with a coach to get started.'}
                      </div>
                    )
                  )}
                </div>

                <div className="p-4 bg-background rounded shadow-sm">
                  <h3 className="text-sm font-medium">Quick Links</h3>
                  <div className="mt-3 flex flex-col gap-2">
                    <Button variant="ghost" onClick={() => navigate('/coaches')}>Find Coaches</Button>
                    <Button variant="ghost" onClick={() => navigate('/resources')}>Resources</Button>
                  </div>
                </div>
              </div>

              {/* Middle column: profile summary + separate About & Achievements cards */}
              <div className="space-y-4">
                <div className="p-4 bg-background rounded shadow-sm">
                  <h3 className="text-sm font-medium">Your profile</h3>
                  <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                    <div className="col-span-1 flex items-center justify-center">
                      <div className="w-24 h-24 rounded-full overflow-hidden flex items-center justify-center">
                        <img
                          key={profile?.profileImageUrl || avatarPulseKey}
                          src={profile?.profileImageUrl || '/avatars/soldier_male.png'}
                          alt="avatar"
                          className="w-24 h-24 object-cover rounded-full"
                          onLoad={() => setAvatarPulseKey(k => k + 1)}
                        />
                      </div>
                    </div>
                    <div className="col-span-2">
                      <div className="text-lg font-semibold">{profile?.firstName} {profile?.lastName}</div>
                      <div className="text-xs text-muted-foreground">{profile?.email}</div>

                      <div className="mt-3">
                        <div className="text-sm font-medium">Education</div>
                        <div className="mt-1 text-sm text-muted-foreground">{profile?.education || 'No education added yet — tell others about your background.'}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-background rounded shadow-sm">
                  <h3 className="text-sm font-medium">About</h3>
                  <div className="mt-2 text-sm">{profile?.bio || 'No bio yet — write a short paragraph about yourself to help others get to know you.'}</div>
                </div>

                <div className="p-4 bg-background rounded shadow-sm">
                  <h3 className="text-sm font-medium">Achievements</h3>
                  <div className="mt-2">
                    {(profile?.achievements || []).length ? (
                      (profile.achievements || []).slice(0,5).map((a: string) => (
                        <span key={a} className="inline-block mr-2 mt-2 bg-muted px-2 py-1 rounded text-xs">{a}</span>
                      ))
                    ) : (
                      <div className="text-sm text-muted-foreground">No achievements yet — add some to showcase your accomplishments.</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right column: role-specific cards (mentor vs normal) */}
              <div className="space-y-4">
                {isMentor ? (
                  <>
                    <RateCard profile={profile} setProfile={setProfile} />

                    <div className="p-4 bg-background rounded shadow-sm">
                      <h3 className="text-sm font-medium">Rating</h3>
                      <div className="mt-2 flex items-center gap-2">
                        <StarRating value={profile?.rating ?? 0} />
                        <div className="text-sm text-muted-foreground">{(profile?.rating ?? 0).toFixed(1)} / 5</div>
                      </div>
                    </div>

                    {/* Manage Availability card removed to declutter dashboard. Use the dedicated page via Sidebar. */}
                  </>
                ) : (
                  <div className="p-4 bg-background rounded shadow-sm">
                    <h3 className="text-sm font-medium">Completed sessions</h3>
                    <div className="mt-2 text-lg font-semibold">{stats?.completed ?? 0}</div>
                    <div className="text-xs text-muted-foreground mt-1">Sessions you have completed on the platform</div>
                  </div>
                )}

                <div className="p-4 bg-background rounded shadow-sm">
                  <h3 className="text-sm font-medium">Manage</h3>
                  <div className="mt-3 flex gap-2 justify-end">
                    <Button variant="secondary" onClick={() => navigate('/profile/edit')}>Edit profile</Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
