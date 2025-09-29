import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Spinner from '@/components/ui/Spinner';
import { apiClient } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

type Props = {
  profile: any;
  // onUpdate will receive the raw availability string array (supports ISO or "startISO|endISO" ranges)
  onUpdate?: (newAvailability: string[]) => void;
};

const ManageAvailabilityPanel: React.FC<Props> = ({ profile, onUpdate }) => {
  const [slots, setSlots] = useState<string[]>([]);
  const [newStart, setNewStart] = useState('');
  const [newEnd, setNewEnd] = useState('');
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Normalize incoming availability into an array of strings
    const raw = Array.isArray(profile?.availability) ? profile.availability : [];
    const normalized = raw
      .map((a: any) => {
        if (!a) return null;
        if (typeof a === 'string') return a; // could be ISO or "start|end"
        if (typeof a === 'object') {
          const s = a.start || a.iso || null;
          const e = a.end || a.until || null;
          if (s && e) return `${new Date(s).toISOString()}|${new Date(e).toISOString()}`;
          if (s) return new Date(s).toISOString();
          return null;
        }
        return null;
      })
      .filter(Boolean) as string[];
    setSlots(normalized);
  }, [profile]);

  const addSlot = () => {
    if (!newStart || !newEnd) {
      toast({ title: 'Missing time', description: 'Please provide both start and end time' });
      return;
    }
    const startDt = new Date(newStart);
    const endDt = new Date(newEnd);
    if (Number.isNaN(startDt.getTime()) || Number.isNaN(endDt.getTime())) {
      toast({ title: 'Invalid time', description: 'Please provide valid start and end times' });
      return;
    }
    if (endDt <= startDt) {
      toast({ title: 'Invalid range', description: 'End time must be after start time' });
      return;
    }
    const now = Date.now();
    if (endDt.getTime() < now - 60000) {
      toast({ title: 'Invalid time', description: 'Cannot add a time range entirely in the past' });
      return;
    }

    const startIso = startDt.toISOString();
    const endIso = endDt.toISOString();

    // Avoid overlapping ranges (treat plain ISO items as 30-min blocks)
    const MIN_BLOCK_MINUTES = 30;
    const overlaps = (aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) => aStart < bEnd && bStart < aEnd;
    const willOverlap = slots.some(s => {
      if (s.includes('|')) {
        const [s1, s2] = s.split('|');
        const bStart = new Date(s1);
        const bEnd = new Date(s2);
        return overlaps(startDt, endDt, bStart, bEnd);
      } else {
        const bStart = new Date(s);
        const bEnd = new Date(bStart.getTime() + MIN_BLOCK_MINUTES * 60000);
        return overlaps(startDt, endDt, bStart, bEnd);
      }
    });
    if (willOverlap) {
      toast({ title: 'Overlapping range', description: 'This time window overlaps an existing one' });
      return;
    }

    const encoded = `${startIso}|${endIso}`;
    // basic dedupe
    if (slots.includes(encoded)) {
      toast({ title: 'Duplicate range', description: 'This time window already exists' });
      return;
    }

    setSlots(s => [...s, encoded]);
    setNewStart('');
    setNewEnd('');
  };

  const removeSlot = (idx: number) => setSlots(s => s.filter((_, i) => i !== idx));

  const save = async () => {
    setSaving(true);
    try {
      // final dedupe + sort
      const unique = Array.from(new Set(slots));
      // sort by range start (or single start)
      unique.sort((a, b) => {
        const aStart = new Date(a.includes('|') ? a.split('|')[0] : a);
        const bStart = new Date(b.includes('|') ? b.split('|')[0] : b);
        return aStart.getTime() - bStart.getTime();
      });
      const payload = { ...profile, availability: unique };
      await apiClient.put('/users/profile', payload);
      toast({ title: 'Availability saved', description: 'Your availability has been updated' });
      onUpdate?.(unique);
    } catch (err: any) {
      console.error('Failed to save availability', err);
      toast({ title: 'Save failed', description: err?.message || 'Could not save availability' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-3 p-4 bg-background rounded">
      <div className="flex flex-col md:flex-row gap-2 items-stretch md:items-center">
        <div className="flex-1 flex gap-2">
          <input type="datetime-local" className="p-2 border rounded w-full" value={newStart} onChange={e => setNewStart(e.target.value)} aria-label="Start time" />
          <input type="datetime-local" className="p-2 border rounded w-full" value={newEnd} onChange={e => setNewEnd(e.target.value)} aria-label="End time" />
        </div>
        <Button onClick={addSlot}>Add window</Button>
      </div>

      <div className="mt-3 space-y-2">
        {slots.length === 0 && <div className="text-sm text-muted-foreground">No availability windows yet</div>}
        {slots.map((s, i) => {
          if (s.includes('|')) {
            const [a, b] = s.split('|');
            return (
              <div key={s} className="flex items-center justify-between p-2 border rounded">
                <div className="text-sm">{new Date(a).toLocaleString()} <span className="text-muted-foreground">to</span> {new Date(b).toLocaleString()}</div>
                <div className="flex items-center gap-2">
                  <button onClick={() => removeSlot(i)} className="text-sm text-red-600">Remove</button>
                </div>
              </div>
            );
          }
          return (
            <div key={s} className="flex items-center justify-between p-2 border rounded">
              <div className="text-sm">{new Date(s).toLocaleString()}</div>
              <div className="flex items-center gap-2">
                <button onClick={() => removeSlot(i)} className="text-sm text-red-600">Remove</button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 text-right">
        <Button onClick={save} disabled={saving}>
          <span className="flex items-center">
            {saving && <Spinner className="w-4 h-4" />}
            <span>{saving ? 'Saving...' : 'Save availability'}</span>
          </span>
        </Button>
      </div>
    </div>
  );
};

export default ManageAvailabilityPanel;
