import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '@/services/authService';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/services/api';
import { useToast } from '@/components/ui/use-toast';
import TagInput from '@/components/ui/TagInput';
import { Button } from '@/components/ui/button';

const UserProfileEdit = () => {
  const [storedUser, setStoredUser] = useState<any>(authService.getCurrentUser());
  const auth = useAuth();
  const token = authService.getToken();
  const [form, setForm] = useState<any>({ achievements: [], skills: [] });
  const [loading, setLoading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (storedUser) {
      setForm((prev: any) => ({ ...prev, ...storedUser }));
      return;
    }

    const fetchUserFromApi = async () => {
      if (!token) return;
      setLoadingProfile(true);
      try {
        const resp: any = await apiClient.get('/users/profile');
        const found = resp?.data ?? resp;
        if (found) {
          setForm((prev: any) => ({ ...prev, ...found }));
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

  // image resize helper (same approach as QuickEdit modal)
  const resizeImage = (file: File, maxDim = 1024, quality = 0.8): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const reader = new FileReader();
      reader.onload = () => {
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let { width, height } = img;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) return reject(new Error('Could not get canvas context'));
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob((blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Canvas toBlob produced null'));
          }, 'image/jpeg', quality);
        };
        img.onerror = (e) => reject(new Error('Image load error'));
        img.src = reader.result as string;
      };
      reader.onerror = (e) => reject(new Error('File read error'));
      reader.readAsDataURL(file);
    });
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setSelectedFile(f);
    // show a quick preview
    const url = URL.createObjectURL(f);
    setPreviewUrl(url);
  };

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

      const payload: any = { ...form };

      // if a new avatar is selected upload it first
      if (selectedFile) {
        try {
          const resizedBlob = await resizeImage(selectedFile, 1024, 0.8);
          const uploadForm = new FormData();
          const uploadFile = new File([resizedBlob], selectedFile.name.replace(/\s+/g, '_'), { type: 'image/jpeg' });
          uploadForm.append('avatar', uploadFile);
          const uploadResp: any = await apiClient.request('/users/upload', { method: 'POST', body: uploadForm });
          const url = uploadResp?.data?.url ?? uploadResp?.url ?? uploadResp;
          if (url) payload.profileImageUrl = url;
        } catch (uploadErr) {
          console.error('Avatar upload failed', uploadErr);
          toast({ title: 'Upload failed', description: 'Could not upload profile photo' });
        }
      }

      const resp: any = await apiClient.put('/users/profile', payload);
      const updated = resp?.data ?? resp;
      toast({ title: 'Profile updated', description: 'Your profile has been saved' });
      auth.login(token, updated);
      setStoredUser(updated);
      setForm(updated);
      // cleanup preview URL
      if (previewUrl) { URL.revokeObjectURL(previewUrl); setPreviewUrl(null); }
      navigate('/dashboard');
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
    <div className="container mx-auto p-6">
      <div className="max-w-4xl mx-auto bg-card rounded shadow p-6">
        <h1 className="text-2xl font-bold mb-4">Edit Profile</h1>
        <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="col-span-1 flex flex-col items-center gap-4">
            <div className="w-36 h-36 rounded-full overflow-hidden bg-muted flex items-center justify-center">
              <img src={previewUrl || form.profileImageUrl || '/avatars/soldier_male.png'} alt="avatar" className="w-36 h-36 object-cover" />
            </div>
            <label className="text-sm">Profile photo</label>
            <input type="file" accept="image/*" onChange={onFileChange} />
            <div className="text-xs text-muted-foreground">Recommended: square image, under 2MB</div>
          </div>

          <div className="col-span-2 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-sm block mb-1">First name</label>
                <input className="w-full p-2 border rounded" value={form.firstName || ''} onChange={e => setForm({ ...form, firstName: e.target.value })} />
              </div>
              <div>
                <label className="text-sm block mb-1">Last name</label>
                <input className="w-full p-2 border rounded" value={form.lastName || ''} onChange={e => setForm({ ...form, lastName: e.target.value })} />
              </div>
            </div>

            <div>
              <label className="text-sm block mb-1">Education</label>
              <input className="w-full p-2 border rounded" value={form.education || ''} onChange={e => setForm({ ...form, education: e.target.value })} />
            </div>

            <div>
              <label className="text-sm block mb-1">Bio</label>
              <textarea className="w-full p-2 border rounded" rows={4} value={form.bio || ''} onChange={e => setForm({ ...form, bio: e.target.value })} />
            </div>

            <div>
              <label className="text-sm block mb-1">Achievements</label>
              <TagInput id="achievements-edit" value={form.achievements || []} onChange={(v) => setForm({ ...form, achievements: v })} placeholder="Add achievement and press Enter" />
            </div>

            <div>
              <label className="text-sm block mb-1">Skills</label>
              <TagInput id="skills-edit" value={form.skills || []} onChange={(v) => setForm({ ...form, skills: v })} placeholder="Add a skill and press Enter" suggestions={["Communication","Leadership","Product","Engineering","UX","Coaching"]} />
            </div>

            <div className="flex gap-3 justify-end">
              <Button variant="ghost" onClick={() => navigate('/dashboard')}>Cancel</Button>
              <Button type="submit">{loading ? 'Saving...' : 'Save profile'}</Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserProfileEdit;

