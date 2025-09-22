import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '@/services/authService';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/services/api';
import { useToast } from '@/components/ui/use-toast';

const UserProfileEdit = () => {
  const [storedUser, setStoredUser] = useState<any>(authService.getCurrentUser());
  const auth = useAuth();
  const token = authService.getToken();
  const [form, setForm] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (storedUser) {
      setForm(storedUser);
      return;
    }

    const fetchUserFromApi = async () => {
      if (!token) return;
      setLoadingProfile(true);
      try {
        const resp: any = await apiClient.get('/users/profile');
        const found = resp?.data ?? resp;
        if (found) {
          setForm(found);
          auth.login(token, found);
          setStoredUser(found);
        }
      } catch (err) {
        console.error('Failed to fetch profile from /users/profile', err);
      } finally {
        setLoadingProfile(false);
      }
    };

    fetchUserFromApi();
  }, [token]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (!token) {
        toast({ title: 'Not authenticated', description: 'Please sign in to edit your profile' });
        navigate('/login', { replace: true });
        setLoading(false);
        return;
      }

      await apiClient.put('/users/profile', form);
  toast({ title: 'Profile updated', description: 'Your profile has been saved' });
  auth.login(token, form);
  setStoredUser(form);
    } catch (err: any) {
      console.error('Profile update error', err);
      if (err?.status === 401) {
        toast({ title: 'Session expired', description: 'Please sign in again to save changes' });
        setLoading(false);
        return;
      }
      toast({ title: 'Update failed', description: err?.message || 'Failed to save profile' });
    }
    setLoading(false);
  };

  if (!storedUser && !token && !loadingProfile) return <div className="p-4">Please login to edit your profile</div>;
  if (!storedUser && !token && loadingProfile) return <div className="p-4">Loading profile...</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Edit Profile</h1>
      <form onSubmit={submit} className="space-y-3 max-w-lg">
        <input placeholder="First name" value={form.firstName || ''} onChange={e => setForm({...form, firstName: e.target.value})} className="w-full p-2 border rounded" />
        <input placeholder="Last name" value={form.lastName || ''} onChange={e => setForm({...form, lastName: e.target.value})} className="w-full p-2 border rounded" />
        <textarea placeholder="Bio" value={form.bio || ''} onChange={e => setForm({...form, bio: e.target.value})} className="w-full p-2 border rounded" />
        <button className="py-2 px-4 bg-primary text-white rounded" disabled={loading}>{loading ? 'Saving...' : 'Save'}</button>
      </form>
    </div>
  );
};

export default UserProfileEdit;

