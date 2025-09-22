import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Spinner from '@/components/ui/Spinner';
import { apiClient } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

type Props = {
  profile: any;
  // newAvailability will be an array of availability entries suitable for the calendar (e.g. { start: ISO })
  onUpdate?: (newAvailability: any[]) => void;
};

const ManageAvailabilityPanel: React.FC<Props> = ({ profile, onUpdate }) => {
  const [slots, setSlots] = useState<string[]>([]);
  const [newSlot, setNewSlot] = useState('');
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Normalize incoming availability into an array of ISO strings
    const raw = Array.isArray(profile?.availability) ? profile.availability : [];
    const normalized = raw
      .map((a: any) => {
        if (!a) return null;
        if (typeof a === 'string') return a;
        // support objects like { start: 'iso' } or { iso: 'iso' }
        if (typeof a === 'object') return a.start || a.iso || null;
        return null;
      })
      .filter(Boolean) as string[];
    setSlots(normalized);
  }, [profile]);

  const addSlot = () => {
    if (!newSlot) return;
    // ensure ISO string
    const dt = new Date(newSlot);
    if (Number.isNaN(dt.getTime())) {
      toast({ title: 'Invalid time', description: 'Please provide a valid date and time' });
      return;
    }
    // prevent adding past dates
    const now = Date.now();
    if (dt.getTime() < now - 60000) { // allow tiny clock skew of 1 minute
      toast({ title: 'Invalid time', description: 'Cannot add a time in the past. Please select a future time.' });
      return;
    }
    const iso = dt.toISOString();

    // basic dedupe: don't add exact duplicates
    if (slots.includes(iso)) {
      toast({ title: 'Duplicate slot', description: 'This time slot already exists' });
      return;
    }

    // basic overlap check: don't add slots within 30 minutes of an existing slot
    const MIN_DIFF_MINUTES = 30;
    const conflict = slots.some(s => {
      const other = new Date(s);
      const diff = Math.abs(other.getTime() - dt.getTime()) / 60000; // minutes
      return diff < MIN_DIFF_MINUTES;
    });
    if (conflict) {
      toast({ title: 'Overlapping slot', description: `Please ensure slots are at least ${MIN_DIFF_MINUTES} minutes apart.` });
      return;
    }

    setSlots(s => [...s, iso]);
    setNewSlot('');
  };

  const removeSlot = (idx: number) => setSlots(s => s.filter((_, i) => i !== idx));

  const save = async () => {
    setSaving(true);
    try {
      // final dedupe + sort
      const unique = Array.from(new Set(slots));
      unique.sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
      const payload = { ...profile, availability: unique };
  await apiClient.put('/users/profile', payload);
  toast({ title: 'Availability saved', description: 'Your availability has been updated' });
  // Notify parent with calendar-friendly objects { start: ISO }
  const calendarShape = (payload.availability as string[]).map(s => ({ start: s }));
  onUpdate?.(calendarShape);
    } catch (err: any) {
      console.error('Failed to save availability', err);
      toast({ title: 'Save failed', description: err?.message || 'Could not save availability' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-3 p-4 bg-background rounded">
      <div className="flex gap-2 items-center">
        <input type="datetime-local" className="p-2 border rounded flex-1" value={newSlot} onChange={e => setNewSlot(e.target.value)} />
        <Button onClick={addSlot}>Add</Button>
      </div>

      <div className="mt-3 space-y-2">
        {slots.length === 0 && <div className="text-sm text-muted-foreground">No availability slots yet</div>}
        {slots.map((s, i) => (
          <div key={s} className="flex items-center justify-between p-2 border rounded">
            <div className="text-sm">{new Date(s).toLocaleString()}</div>
            <div className="flex items-center gap-2">
              <button onClick={() => removeSlot(i)} className="text-sm text-red-600">Remove</button>
            </div>
          </div>
        ))}
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
