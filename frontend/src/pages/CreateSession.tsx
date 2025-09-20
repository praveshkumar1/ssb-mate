import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '@/services/api';

const CreateSession = () => {
  const [form, setForm] = useState({ title: '', description: '', mentorId: '', sessionType: 'general_mentoring', duration: 60, scheduledAt: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await apiClient.post('/sessions', form);
      navigate('/sessions');
    } catch (err: any) {
      setError(err?.message || 'Failed to create session');
    } finally { setLoading(false); }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Create Session</h1>
      <form onSubmit={submit} className="space-y-3 max-w-lg">
        <input placeholder="Title" className="w-full p-2 border rounded" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
        <textarea placeholder="Description" className="w-full p-2 border rounded" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
        <input placeholder="Mentor ID" className="w-full p-2 border rounded" value={form.mentorId} onChange={e => setForm({...form, mentorId: e.target.value})} />
        <input type="datetime-local" className="w-full p-2 border rounded" value={form.scheduledAt} onChange={e => setForm({...form, scheduledAt: e.target.value})} />
        {error && <div className="text-red-600">{error}</div>}
        <button className="py-2 px-4 bg-primary text-white rounded" disabled={loading}>{loading ? 'Creating...' : 'Create'}</button>
      </form>
    </div>
  );
};

export default CreateSession;
