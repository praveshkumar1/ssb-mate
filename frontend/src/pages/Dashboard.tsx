import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Sidebar from '@/components/layout/Sidebar';
import { Button } from '@/components/ui/button';
import Spinner from '@/components/ui/Spinner';
import { apiClient } from '@/services/api';
import { sessionService } from '@/services/sessionService';
import { useToast } from '@/hooks/use-toast';
import ManageAvailabilityPanel from '@/components/coach/ManageAvailabilityPanel';
import QuickEditProfileModal from '@/components/QuickEditProfileModal';

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
  const [quickEditOpen, setQuickEditOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [avatarPulseKey, setAvatarPulseKey] = useState(0);

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

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 flex gap-6">
        <Sidebar />
        <main className="flex-1">
          <div className="bg-card p-6 rounded shadow">
            {isMentor ? (
              <div>
                <h2 className="text-xl font-semibold">Mentor Dashboard</h2>
                <p className="text-sm text-muted-foreground">Quick view of your upcoming sessions and recent activity.</p>

                <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <section>
                    <h3 className="text-sm font-medium">Upcoming Sessions</h3>
                    {loading ? (
                      <div className="h-24 bg-muted animate-pulse mt-2 rounded" />
                    ) : (
                      <ul className="mt-2 space-y-3">
                        {(mentor.upcoming || []).slice(0, 5).map((s: any) => (
                          <li key={s._id || s.id} className="p-3 border rounded flex items-center justify-between">
                            <div>
                              <div className="font-bold">{s.title}</div>
                              <div className="text-xs text-muted-foreground">{new Date(s.scheduledAt).toLocaleString()}</div>
                              <div className="text-sm text-muted-foreground">{renderPerson(s.menteeName || s.mentee || s.menteeId)}</div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              {s.meetingLink && (
                                <a href={s.meetingLink} target="_blank" rel="noopener noreferrer" className="text-white bg-primary px-3 py-1 rounded">Start Session</a>
                              )}
                              <Link to={`/sessions/${s._id || s.id}`} className="text-primary">Details</Link>
                            </div>
                          </li>
                        ))}
                        {(mentor.upcoming || []).length === 0 && <li className="text-sm text-muted-foreground">No upcoming sessions</li>}
                      </ul>
                    )}
                  </section>

                  <section>
                    <h3 className="text-sm font-medium">Manage Availability</h3>
                    <p className="text-xs text-muted-foreground">Add available time slots that learners can book. Times are stored in ISO format (UTC).</p>
                    <div className="mt-3">
                      <ManageAvailabilityPanel profile={profile} onUpdate={(newAvailability: string[]) => {
                        setProfile((p: any) => ({ ...p, availability: newAvailability }));
                      }} />
                    </div>
                  </section>
                </div>
                
                <div className="mt-6">
                  <h3 className="text-sm font-medium">Your coach profile</h3>
                  <div className="mt-3 p-4 bg-background rounded shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                    <div className="col-span-1 flex items-center justify-center">
                      <div className="w-24 h-24 rounded-full overflow-hidden flex items-center justify-center">
                        <img
                          key={profile?.profileImageUrl || avatarPulseKey}
                          src={profile?.profileImageUrl || '/placeholder.svg'}
                          alt="avatar"
                          className="w-24 h-24 object-cover rounded-full transform transition-transform duration-500"
                          onLoad={() => { /* trigger a small scale animation */ setAvatarPulseKey(k => k + 1); }}
                        />
                      </div>
                    </div>
                    <div className="col-span-1 md:col-span-1">
                      <div className="text-lg font-semibold">{profile?.firstName} {profile?.lastName}</div>
                      <div className="text-sm text-muted-foreground">{profile?.education || ''}</div>
                      <div className="mt-2 text-sm">{profile?.bio || 'No bio yet. Add a short description about your coaching approach.'}</div>
                      <div className="mt-2">
                        {(profile?.specializations || []).slice(0,5).map((s: string) => (
                          <span key={s} className="inline-block mr-2 mt-2 bg-muted px-2 py-1 rounded text-xs">{s}</span>
                        ))}
                      </div>
                    </div>
                    <div className="col-span-1 md:col-span-1 flex flex-col items-end gap-3">
                      <div className="text-sm">Rate: <span className="font-semibold">{profile?.hourlyRate ? `$${profile.hourlyRate}` : 'Not set'}</span></div>
                      <div className="text-sm">Experience: <span className="font-semibold">{profile?.experience ? `${profile.experience} yrs` : 'Not set'}</span></div>
                      <div className="text-sm">Total sessions: <span className="font-semibold">{sessions.filter(s => String(s.mentorId) === String(profile._id)).length}</span></div>
                      <div className="text-sm">Rating: <span className="font-semibold">{profile?.rating ?? 0} / 5</span></div>
                        <div className="text-sm text-muted-foreground">{profile?.education || ''}</div>
                        {profile?.email && <div className="text-xs text-muted-foreground">{profile.email}</div>}
                      <div className="text-sm">Completed: <span className="font-semibold">{stats?.completed ?? '-'}</span></div>
                      <div className="text-sm">Revenue: <span className="font-semibold">${stats?.revenue ?? '0.00'}</span></div>
                      <div>
                        <div className="flex gap-2">
                          <Button variant="secondary" onClick={() => navigate('/profile/edit')}>Edit profile</Button>
                          <Button variant="outline" onClick={() => setQuickEditOpen(true)}>Quick edit</Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <QuickEditProfileModal open={quickEditOpen} onClose={() => setQuickEditOpen(false)} profile={profile} onSaved={(updated: any) => {
                  const newProfile = updated?.data ?? updated;
                  setProfile(newProfile);
                  // bump key to re-render avatar and trigger animation
                  setAvatarPulseKey(k => k + 1);
                }} />
              </div>
            ) : (
              <div>
                <h2 className="text-xl font-semibold">Welcome{profile?.firstName ? `, ${profile.firstName}` : ''}</h2>
                <p className="text-sm text-muted-foreground">Here is a quick overview of your account.</p>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-background rounded">
                    <h3 className="text-sm font-medium">Profile</h3>
                    {loading ? (
                      <div className="h-6 bg-muted rounded animate-pulse" />
                    ) : (
                      <div className="mt-2">
                        <div className="text-sm">{profile?.firstName} {profile?.lastName}</div>
                        <div className="text-xs text-muted-foreground">{profile?.email}</div>
                        <div className="mt-2"><Button variant="ghost" onClick={() => navigate('/profile/edit')}>Edit Profile</Button></div>
                      </div>
                    )}
                  </div>

                  <div className="p-4 bg-background rounded">
                    <h3 className="text-sm font-medium">Upcoming Sessions</h3>
                    {loading ? (
                      <div className="h-12 bg-muted rounded animate-pulse mt-2" />
                    ) : (
                      <ul className="mt-2 space-y-2">
                        {sessions.length === 0 && <li className="text-sm text-muted-foreground">No upcoming sessions</li>}
                        {sessions.slice(0, 3).map(s => (
                          <li key={s._id || s.id} className="text-sm">{s.title || s.name} <div className="text-xs text-muted-foreground">{new Date(s.scheduledAt || s.createdAt || Date.now()).toLocaleString()}</div></li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="p-4 bg-background rounded">
                    <h3 className="text-sm font-medium">Quick Links</h3>
                    <div className="mt-2 flex flex-col gap-2">
                      <Button variant="ghost" onClick={() => navigate('/coaches')}>Find Coaches</Button>
                      <Button variant="ghost" onClick={() => navigate('/sessions/create')}>Create Session</Button>
                      <Button variant="ghost" onClick={() => navigate('/resources')}>Resources</Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
