import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useMutation } from '@tanstack/react-query';
import { discussionService } from '@/services/discussionService';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const AdminCreateDiscussion: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startTime, setStartTime] = useState(''); // datetime-local value
  const [capacity, setCapacity] = useState<number>(10);
  const [meetLink, setMeetLink] = useState('');
  const { toast } = useToast();
  const navigate = useNavigate();

  const mutation = useMutation({
    mutationFn: () => discussionService.adminCreate({
      title,
      description: description || undefined,
      startTime: startTime ? new Date(startTime).toISOString() : new Date().toISOString(),
      capacity: capacity || 10,
      meetLink,
    }),
    onSuccess: () => {
      toast({ title: 'Created', description: 'Live discussion created successfully.' });
      navigate('/discussions');
    },
    onError: (e: any) => {
      const msg = e?.data?.error || e?.message || 'Failed to create discussion';
      toast({ variant: 'destructive', title: 'Error', description: msg });
    },
  });

  if (!isAdmin) {
    return (
      <div className="container mx-auto px-4 py-6">
        <p className="text-destructive">Admins only.</p>
      </div>
    );
  }

  const canSubmit = title.trim() && startTime && meetLink.trim();

  return (
    <div className="container mx-auto px-4 py-6">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Create Live Discussion</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Discussion title" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Optional description" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Start Time</label>
            <Input type="datetime-local" value={startTime} onChange={e => setStartTime(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Capacity</label>
            <Input type="number" min={1} value={capacity} onChange={e => setCapacity(parseInt(e.target.value || '10', 10))} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Meet Link</label>
            <Input value={meetLink} onChange={e => setMeetLink(e.target.value)} placeholder="https://meet.google.com/…" />
          </div>
          <div className="pt-2">
            <Button disabled={!canSubmit || mutation.isPending} onClick={() => mutation.mutate()}>Create</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminCreateDiscussion;
