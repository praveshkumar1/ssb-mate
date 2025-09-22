import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '@/components/layout/Sidebar';
import { sessionService } from '@/services/sessionService';
import { apiClient } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import Spinner from '@/components/ui/Spinner';

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

const ManageSessions: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const profRaw = await apiClient.get<any>('/users/profile');
        const prof = profRaw?.data ?? profRaw;
        if (!mounted) return;
        if (!prof || prof.role !== 'mentor') {
          navigate('/dashboard', { replace: true });
          return;
        }
        setProfile(prof);
        await fetchSessions(prof._id || prof.id);
      } catch (e: any) {
        console.error('ManageSessions load', e);
        if (e?.status === 401) {
          navigate('/login', { replace: true });
          return;
        }
        toast({ title: 'Could not load sessions', description: e?.message || 'Unexpected error' });
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [navigate, toast]);

  const fetchSessions = async (mentorId?: string) => {
    if (!mentorId) return;
    setLoading(true);
    try {
      const res: any = await sessionService.getSessions({ mentorId });
      const data = res?.data ?? res ?? [];
      setSessions(data);
    } catch (e) {
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handler = () => {
      if (profile?.role === 'mentor' && profile?._id) fetchSessions(profile._id);
    };
    window.addEventListener('sessions:changed', handler as EventListener);
    return () => window.removeEventListener('sessions:changed', handler as EventListener);
  }, [profile]);

  const markComplete = async (s: any) => {
    const id = s._id || s.id;
    setActionLoading(a => ({ ...a, [id]: true }));
    try {
      await sessionService.updateSession(id, { status: 'completed' });
      setSessions(prev => prev.map(x => x._id === id ? { ...x, status: 'completed' } : x));
      toast({ title: 'Session updated', description: 'Marked as completed' });
      window.dispatchEvent(new CustomEvent('sessions:changed'));
    } catch (e: any) {
      console.error('Mark complete failed', e);
      toast({ title: 'Update failed', description: e?.message || 'Could not update session' });
    } finally {
      setActionLoading(a => ({ ...a, [id]: false }));
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 flex gap-6">
        <Sidebar />
        <main className="flex-1">
          <div className="bg-card p-6 rounded shadow">
            <h2 className="text-xl font-semibold">Manage Sessions</h2>
            <p className="text-sm text-muted-foreground">Only mentors can access this page. Use this page to mark sessions as completed.</p>

            <div className="mt-6">
              {loading ? (
                  <div className="h-24 bg-muted animate-pulse rounded" />
                ) : (
                  <div className="space-y-6">
                    <section>
                      <h3 className="text-sm font-medium">Upcoming Sessions</h3>
                      <ul className="mt-2 space-y-3">
                        {sessions.filter(s => new Date(s.scheduledAt).getTime() >= Date.now()).length === 0 && <li className="text-sm text-muted-foreground">No upcoming sessions</li>}
                        {sessions.filter(s => new Date(s.scheduledAt).getTime() >= Date.now()).map(s => (
                          <li key={s._id || s.id} className="p-3 border rounded flex items-center justify-between">
                            <div>
                              <div className="font-bold">{s.title || s.name}</div>
                              <div className="text-xs text-muted-foreground">{new Date(s.scheduledAt).toLocaleString()}</div>
                              <div className="text-sm text-muted-foreground">{renderPerson(s.mentee || s.menteeName || s.menteeId)}</div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button className="px-3 py-1 border rounded text-sm flex items-center" onClick={() => markComplete(s)} disabled={!!actionLoading[s._id || s.id]}>
                                {actionLoading[s._id || s.id] ? <Spinner /> : 'Mark complete'}
                              </button>
                              <a href={`/sessions/${s._id || s.id}`} className="text-primary">Details</a>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </section>

                    <section>
                      <h3 className="text-sm font-medium">Past Sessions</h3>
                      <ul className="mt-2 space-y-3">
                        {sessions.filter(s => new Date(s.scheduledAt).getTime() < Date.now()).length === 0 && <li className="text-sm text-muted-foreground">No past sessions</li>}
                        {sessions.filter(s => new Date(s.scheduledAt).getTime() < Date.now()).map(s => (
                          <li key={s._id || s.id} className="p-3 border rounded flex items-center justify-between">
                            <div>
                              <div className="font-bold">{s.title || s.name}</div>
                              <div className="text-xs text-muted-foreground">{new Date(s.scheduledAt).toLocaleString()}</div>
                              <div className="text-sm text-muted-foreground">{renderPerson(s.mentee || s.menteeName || s.menteeId)}</div>
                            </div>
                            <div className="flex items-center gap-2">
                              <a href={`/sessions/${s._id || s.id}`} className="text-primary">Details</a>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </section>
                  </div>
                )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ManageSessions;
