import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { coachService } from '@/services/coachService';
import { apiClient } from '@/services/api';

const CreateSession = () => {
  const [form, setForm] = useState({ title: '', description: '', mentorId: '', sessionType: 'general_mentoring', duration: 60, scheduledAt: '', price: null as number | null });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const [selectedCoach, setSelectedCoach] = useState<any>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await apiClient.post('/sessions', form);
      navigate('/dashboard/sessions');
    } catch (err: any) {
      setError(err?.message || 'Failed to create session');
    } finally { setLoading(false); }
  };

  // Prefill mentorId (or coachId) from query string if present and fetch coach details
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const mentorId = params.get('mentorId');
    const coachId = params.get('coachId');
    const startsAt = params.get('startsAt');
    const sessionType = params.get('sessionType');
    const minutes = params.get('minutes');
    const price = params.get('price');

    const updates: any = {};
    if (mentorId) updates.mentorId = mentorId;
    if (sessionType) updates.sessionType = sessionType;
    if (minutes) updates.duration = parseInt(minutes);
    if (price) updates.price = Number(price);

    // convert ISO string to datetime-local format used by input
    if (startsAt) {
      const dt = new Date(startsAt);
      if (!Number.isNaN(dt.getTime())) {
        const pad = (n: number) => String(n).padStart(2, '0');
        const local = `${dt.getFullYear()}-${pad(dt.getMonth()+1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
        updates.scheduledAt = local;
      }
    }

    if (Object.keys(updates).length > 0) {
      setForm(f => ({ ...f, ...updates }));
    }

    // If coachId is provided prefer it and fetch coach details
    const resolvedId = coachId || mentorId;
    if (resolvedId) {
      setForm(f => ({ ...f, mentorId: resolvedId }));
      (async () => {
        try {
          const c = await coachService.getCoachById(resolvedId);
          const coachObj = c;
          if (coachObj) setSelectedCoach(coachObj);
        } catch (err) {
          console.warn('Could not fetch coach by id', err);
        }
      })();
    }
  }, []);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Create Session</h1>
      <form onSubmit={submit} className="space-y-3 max-w-lg">
        <input placeholder="Title" className="w-full p-2 border rounded" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
        <textarea placeholder="Description" className="w-full p-2 border rounded" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
        {selectedCoach ? (
          <div className="p-2 border rounded bg-muted/10">
            <div className="font-medium">{selectedCoach.name || `${selectedCoach.firstName || ''} ${selectedCoach.lastName || ''}`}</div>
            <div className="text-xs text-muted-foreground">Mentor pre-selected</div>
          </div>
        ) : (
          <input placeholder="Mentor ID" className="w-full p-2 border rounded" value={form.mentorId} onChange={e => setForm({...form, mentorId: e.target.value})} />
        )}
        <input type="datetime-local" className="w-full p-2 border rounded" value={form.scheduledAt} onChange={e => setForm({...form, scheduledAt: e.target.value})} />
        {error && <div className="text-red-600">{error}</div>}
        <button className="py-2 px-4 bg-primary text-white rounded" disabled={loading}>{loading ? 'Creating...' : 'Create'}</button>
      </form>

      <div className="mt-6 p-3 border rounded bg-muted/30 max-w-lg">
        <div className="text-sm font-medium">Debug — query params & form state</div>
        <pre className="text-xs mt-2 whitespace-pre-wrap">{JSON.stringify({ query: window.location.search, form }, null, 2)}</pre>
      </div>
    </div>
  );
};

export default CreateSession;
