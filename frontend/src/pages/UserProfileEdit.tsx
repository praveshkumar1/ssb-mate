import { useState, useEffect } from 'react';
import authService from '@/services/authService';
import { apiClient } from '@/services/api';
import { toast } from '@/components/ui/use-toast';

// Quick JWT decode (no verification) to get payload
function decodeJwtPayload(token: string) {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decodeURIComponent(escape(decoded)));
  } catch (e) {
    return null;
  }
}

const UserProfileEdit = () => {
  const storedUser = authService.getCurrentUser();
  const token = authService.getToken();
  const [form, setForm] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);

  useEffect(() => {
    // If we already have a stored user, use it
    if (storedUser) {
      setForm(storedUser);
      return;
    }

    // If no stored user but token exists, try to decode token and fetch user from backend list
    const fetchUserFromApi = async () => {
      if (!token) return;
      setLoadingProfile(true);
      try {
        // Call protected endpoint to fetch authenticated user's profile
        const resp: any = await apiClient.get('/users/profile');
        const found = resp?.data ?? resp;
        if (found) {
          setForm(found);
          authService.storeAuthData(token, found);
        }
      } catch (err) {
        console.error('Failed to fetch profile from /users/profile', err);
      } finally {
        setLoadingProfile(false);
      }
    };

    fetchUserFromApi();
  }, [storedUser, token]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiClient.put(`/users/profile`, form);
      toast({ title: 'Profile updated', description: 'Your profile has been saved' });
      // Update stored copy
      if (token) authService.storeAuthData(token, form);
    } catch (err) { console.error(err); toast({ title: 'Update failed', description: 'Failed to save profile' }); }
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
