import React, { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { discussionService, LiveDiscussion } from '@/services/discussionService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

function formatDateTime(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleString();
  } catch {
    return iso;
  }
}

function getStatus(d: LiveDiscussion) {
  const now = new Date();
  const start = new Date(d.startTime);
  const joinClose = new Date(start.getTime() - 10 * 60 * 1000);
  const accessOpen = new Date(start.getTime() - 5 * 60 * 1000);
  const isFull = d.attendees.length >= d.capacity;

  return {
    isFull,
    canJoin: now < joinClose && !isFull,
    canAccess: now >= accessOpen,
    joinClosed: now >= joinClose,
    accessOpensAt: accessOpen,
  };
}

const Discussions: React.FC = () => {
  const { data, isLoading, isError } = useQuery({ queryKey: ['discussions'], queryFn: discussionService.list });
  const auth = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const joinMutation = useMutation({
    mutationFn: (id: string) => discussionService.join(id),
    onSuccess: () => {
      toast({ title: 'Joined', description: 'You have reserved a seat.' });
      queryClient.invalidateQueries({ queryKey: ['discussions'] });
    },
    onError: (e: any) => {
      const msg = e?.data?.error || e?.message || 'Failed to join';
      toast({ variant: 'destructive', title: 'Join failed', description: msg });
    },
  });

  const accessMutation = useMutation({
    mutationFn: (id: string) => discussionService.access(id),
    onSuccess: (res) => {
      const url = res.meetLink;
      if (url) window.open(url, '_blank');
    },
    onError: (e: any) => {
      const msg = e?.data?.error || e?.message || 'Access not available yet';
      toast({ variant: 'destructive', title: 'Access denied', description: msg });
    },
  });

  const discussions = data || [];

  const myId = useMemo(() => auth.user?._id || auth.user?.id || auth.user?.userId, [auth.user]);

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-4">Live Discussions</h1>
      {isLoading && <p>Loading…</p>}
      {isError && <p className="text-destructive">Failed to load discussions.</p>}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {discussions.map((d) => {
          const s = getStatus(d);
          const isAttendee = d.attendees.some((a: any) => String(a?._id || a?.id || a) === String(myId));
          const attendees = (d.attendees as any[]).map(a => typeof a === 'string' ? { _id: a } : a);
          const firstThree = attendees.slice(0, 3);
          const extra = Math.max(0, attendees.length - firstThree.length);
          return (
            <Card key={d._id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="truncate pr-2">{d.title}</span>
                  <span className="text-sm font-normal text-muted-foreground whitespace-nowrap">{d.attendees.length}/{d.capacity}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {d.description && <p className="text-sm text-muted-foreground">{d.description}</p>}
                <div className="flex items-center justify-between">
                  <p className="text-sm">Starts: <span className="font-medium">{formatDateTime(d.startTime)}</span></p>
                  <div className="flex -space-x-2 items-center">
                    {firstThree.map((a: any) => {
                      const name = (a.firstName || '') + ' ' + (a.lastName || '');
                      const initials = ((a.firstName?.[0] || '') + (a.lastName?.[0] || '')).toUpperCase() || 'U';
                      return (
                        <Avatar key={String(a._id || a.id)} className="h-7 w-7 ring-2 ring-background">
                          {a.profileImageUrl ? (
                            <AvatarImage src={a.profileImageUrl} alt={name || 'Attendee'} />
                          ) : (
                            <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
                          )}
                        </Avatar>
                      );
                    })}
                    {extra > 0 && (
                      <div className="h-7 w-7 rounded-full bg-muted text-foreground/80 text-[10px] flex items-center justify-center ring-2 ring-background">+{extra}</div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  {!isAttendee ? (
                    <Button disabled={!s.canJoin || joinMutation.isPending} onClick={() => joinMutation.mutate(d._id)}>
                      {s.isFull ? 'Full' : s.joinClosed ? 'Join closed' : 'Join'}
                    </Button>
                  ) : (
                    <>
                      <Button variant="secondary" disabled={!s.canAccess || accessMutation.isPending} onClick={() => accessMutation.mutate(d._id)}>
                        {s.canAccess ? 'Enter' : `Opens ${(s.accessOpensAt).toLocaleTimeString()}`}
                      </Button>
                      <Button variant="outline" disabled>
                        Joined
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      {auth.user?.role === 'admin' && (
        <div className="mt-6">
          <a href="/admin/discussions/new" className="text-primary underline">Create a discussion (admin)</a>
        </div>
      )}
    </div>
  );
};

export default Discussions;
