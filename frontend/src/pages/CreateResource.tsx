import { useState } from 'react';
import resourceService from '@/services/resourceService';
import { useNavigate } from 'react-router-dom';

const CreateResource = () => {
  const [form, setForm] = useState({ title: '', description: '', content: '', category: 'interview_tips', tags: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...form, tags: form.tags.split(',').map(s => s.trim()).filter(Boolean) };
      await resourceService.createResource ? resourceService.createResource(payload) : (await fetch('/api/resources', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload) }));
      navigate('/resources');
    } catch (err) { console.error(err); alert('Failed to create resource'); }
    setLoading(false);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Create Resource</h1>
      <form onSubmit={submit} className="space-y-3 max-w-lg">
        <input placeholder="Title" className="w-full p-2 border rounded" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
        <input placeholder="Description" className="w-full p-2 border rounded" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
        <textarea placeholder="Content" className="w-full p-2 border rounded" value={form.content} onChange={e => setForm({...form, content: e.target.value})} />
        <input placeholder="Tags (comma separated)" className="w-full p-2 border rounded" value={form.tags} onChange={e => setForm({...form, tags: e.target.value})} />
        <button className="py-2 px-4 bg-primary text-white rounded" disabled={loading}>{loading ? 'Creating...' : 'Create'}</button>
      </form>
    </div>
  );
};

export default CreateResource;
