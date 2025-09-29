import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiClient } from '@/services/api';
import { toast } from '@/components/ui/use-toast';

type Props = {
  open: boolean;
  onClose: () => void;
  profile: any;
  onSaved?: (updated: any) => void;
};

const QuickEditProfileModal: React.FC<Props> = ({ open, onClose, profile, onSaved }) => {
  const [bio, setBio] = useState(profile?.bio || '');
  const [hourlyRate, setHourlyRate] = useState(profile?.hourlyRate ?? '');
  const [saving, setSaving] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileData, setFileData] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFileName(f.name);
    // store raw File for upload/resizing
    setFileData(null);
    setSelectedFile(f);
  };

  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Resize image to max dimension keeping aspect ratio, return Blob
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

  const submit = async () => {
    setSaving(true);
    try {
      const payload: any = {};
      if (bio !== undefined) payload.bio = bio;
      if (hourlyRate !== undefined && hourlyRate !== null && hourlyRate !== '') payload.hourlyRate = Number(hourlyRate);
      // If a file was selected, resize and upload it first to get a URL
      if (selectedFile) {
        try {
          const resizedBlob = await resizeImage(selectedFile, 1024, 0.8);
          // show preview
          const preview = URL.createObjectURL(resizedBlob);
          setPreviewUrl(preview);

          const form = new FormData();
          const uploadFile = new File([resizedBlob], selectedFile.name.replace(/\s+/g, '_'), { type: 'image/jpeg' });
          form.append('avatar', uploadFile);
          const uploadResp: any = await apiClient.request('/users/upload', { method: 'POST', body: form });
          const url = uploadResp?.data?.url ?? uploadResp?.url ?? uploadResp;
          if (url) payload.profileImageUrl = url;
        } catch (uploadErr) {
          console.error('Upload failed', uploadErr);
          toast({ title: 'Upload failed', description: 'Could not upload profile image' });
        }
      }

      const resp: any = await apiClient.put('/users/profile', payload);
      const data = resp?.data ?? resp;
      toast({ title: 'Saved', description: 'Profile quick-update saved' });
      onSaved?.(data);
      // revoke preview URL after saving to avoid memory leaks
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      onClose();
    } catch (err: any) {
      console.error('Quick edit save failed', err);
      toast({ title: 'Save failed', description: err?.message || 'Could not save profile' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <DialogContent>
        <DialogTitle>Quick edit profile</DialogTitle>
        <DialogDescription className="mb-4">Small changes to your bio, hourly rate, or profile photo.</DialogDescription>
        <div className="space-y-3">
          <textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Short bio" className="w-full p-2 border rounded" />
          <Input placeholder="Hourly rate (INR)" type="number" value={hourlyRate} onChange={e => setHourlyRate(e.target.value)} />
          <div>
            <label className="text-sm">Profile photo</label>
            <input type="file" accept="image/*" onChange={onFileChange} />
            {fileName && <div className="text-xs text-muted-foreground mt-1">Selected: {fileName}</div>}
            {previewUrl && (
              <div className="mt-2">
                <img src={previewUrl} alt="preview" className="h-24 w-24 rounded-full object-cover ring-2 ring-primary transition-transform duration-300" />
              </div>
            )}
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
            <Button onClick={submit} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
          </div>
        </div>
        <DialogFooter />
      </DialogContent>
    </Dialog>
  );
};

export default QuickEditProfileModal;
