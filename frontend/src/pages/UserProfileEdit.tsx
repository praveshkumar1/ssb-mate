import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '@/services/authService';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/services/api';
import { useToast } from '@/components/ui/use-toast';
import TagInput from '@/components/ui/TagInput';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import supabase from '@/services/supabase';

const UserProfileEdit = () => {
  const [storedUser, setStoredUser] = useState<any>(authService.getCurrentUser());
  const auth = useAuth();
  const token = authService.getToken();
  const [form, setForm] = useState<any>({ achievements: [], skills: [] });
  const [loading, setLoading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (storedUser) {
      setForm((prev: any) => ({ ...prev, ...storedUser }));
      setLoadingProfile(false);
      return;
    }

    const fetchUserFromApi = async () => {
      setLoadingProfile(true);
      try {
        const resp: any = await apiClient.get('/users/profile');
        const found = resp?.data ?? resp;
        if (found) {
          setForm((prev: any) => ({ ...prev, ...found }));
          // If we have a token, use normal login; otherwise, store user and refresh context
          if (token) {
            auth.login(token, found);
          } else {
            localStorage.setItem('user', JSON.stringify(found));
            auth.refresh();
          }
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
      const payload: any = { ...form };

      // if a new avatar is selected, upload it first
      if (selectedFile) {
        try {
          const resizedBlob = await resizeImage(selectedFile, 1024, 0.8);
          const fileName = selectedFile.name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9._-]/g, '');
          const ext = fileName.includes('.') ? fileName.split('.').pop() : 'jpg';
          const safeName = `${Date.now()}-${Math.random().toString(36).slice(2,8)}.${ext}`;

          // If frontend Supabase is configured, upload directly using anon key
          if (supabase && import.meta.env.VITE_SUPABASE_BUCKET) {
            const bucket = import.meta.env.VITE_SUPABASE_BUCKET as string;
            const userId = (storedUser?._id || storedUser?.id || 'public').toString();
            const objectPath = `profiles/${userId}/${safeName}`;
            try {
              const { error: upErr } = await supabase.storage.from(bucket).upload(objectPath, resizedBlob, {
                contentType: 'image/jpeg',
                upsert: false
              });
              if (upErr) throw upErr;
              const { data: pub } = supabase.storage.from(bucket).getPublicUrl(objectPath);
              const url = pub?.publicUrl;
              if (url) payload.profileImageUrl = url;
            } catch (err) {
              const fallback = (import.meta.env.VITE_UPLOAD_BACKEND_FALLBACK as string) === 'true';
              if (fallback) {
                const uploadForm = new FormData();
                const uploadFile = new File([resizedBlob], fileName || 'avatar.jpg', { type: 'image/jpeg' });
                uploadForm.append('avatar', uploadFile);
                const uploadResp: any = await apiClient.request('/users/upload', { method: 'POST', body: uploadForm });
                const url = uploadResp?.data?.url ?? uploadResp?.url ?? uploadResp;
                if (url) payload.profileImageUrl = url;
              } else {
                throw err;
              }
            }
          } else {
            // Fallback to backend upload endpoint
            const uploadForm = new FormData();
            const uploadFile = new File([resizedBlob], fileName || 'avatar.jpg', { type: 'image/jpeg' });
            uploadForm.append('avatar', uploadFile);
            const uploadResp: any = await apiClient.request('/users/upload', { method: 'POST', body: uploadForm });
            const url = uploadResp?.data?.url ?? uploadResp?.url ?? uploadResp;
            if (url) payload.profileImageUrl = url;
          }
        } catch (uploadErr: any) {
          console.error('Avatar upload failed', uploadErr);
          toast({ title: 'Upload failed', description: uploadErr?.message || 'Could not upload profile photo' });
        }
      }

      const resp: any = await apiClient.put('/users/profile', payload);
      const updated = resp?.data ?? resp;
      toast({ title: 'Profile updated', description: 'Your profile has been saved' });
      if (token) {
        auth.login(token, updated);
      } else {
        localStorage.setItem('user', JSON.stringify(updated));
        auth.refresh();
      }
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

  if (loadingProfile) return <div className="p-4">Loading profile...</div>;

  return (
    <main className="container mx-auto p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Edit Profile</h1>
            <p className="text-sm text-muted-foreground">Update your personal information and how others see you.</p>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Profile</CardTitle>
            <CardDescription>Your avatar and basic details</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="col-span-1">
                <div className="flex flex-col items-center gap-4">
                  <Avatar className="h-36 w-36">
                    <AvatarImage src={previewUrl || form.profileImageUrl || '/avatars/soldier_male.png'} alt="avatar" />
                    <AvatarFallback>
                      {(form.firstName?.[0] || 'U').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="w-full space-y-2">
                    <Label htmlFor="avatar">Profile photo</Label>
                    <Input id="avatar" type="file" accept="image/*" onChange={onFileChange} />
                    <p className="text-xs text-muted-foreground">Recommended: square JPG/PNG under 2MB</p>
                  </div>
                </div>
              </div>

              <div className="col-span-2 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First name</Label>
                    <Input id="firstName" value={form.firstName || ''} onChange={e => setForm({ ...form, firstName: e.target.value })} />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last name</Label>
                    <Input id="lastName" value={form.lastName || ''} onChange={e => setForm({ ...form, lastName: e.target.value })} />
                  </div>
                </div>

                <div>
                  <Label htmlFor="education">Education</Label>
                  <Input id="education" value={form.education || ''} onChange={e => setForm({ ...form, education: e.target.value })} />
                </div>

                <div>
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea id="bio" rows={4} value={form.bio || ''} onChange={e => setForm({ ...form, bio: e.target.value })} />
                </div>

                <Separator />

                <div>
                  <Label>Achievements</Label>
                  <TagInput id="achievements-edit" value={form.achievements || []} onChange={(v) => setForm({ ...form, achievements: v })} placeholder="Add achievement and press Enter" />
                </div>

                <div>
                  <Label>Skills</Label>
                  <TagInput id="skills-edit" value={form.skills || []} onChange={(v) => setForm({ ...form, skills: v })} placeholder="Add a skill and press Enter" suggestions={["Communication","Leadership","Product","Engineering","UX","Coaching"]} />
                </div>

                <div className="flex gap-3 justify-end pt-2">
                  <Button type="button" variant="ghost" onClick={() => navigate('/dashboard')}>Cancel</Button>
                  <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save changes'}</Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
};

export default UserProfileEdit;

