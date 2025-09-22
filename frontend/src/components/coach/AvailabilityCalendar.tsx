import React from 'react';

type Props = {
  availability?: any[]; // list of availability slots (to be defined by backend)
  onSelect?: (slot: any) => void;
};

const AvailabilityCalendar: React.FC<Props> = ({ availability = [], onSelect }) => {
  // lightweight placeholder calendar: show next 7 days with available slots
  const days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
  });

  // map availability entries by date string for demo purposes
  const byDate = new Map<string, any[]>();
  availability.forEach((slot: any) => {
    try {
      // support various shapes: string (ISO), { start: ISO }, { iso: ISO }
      const iso = typeof slot === 'string' ? slot : (slot?.start || slot?.iso || null);
      if (!iso) return;
      const day = new Date(iso).toISOString().slice(0, 10);
      const arr = byDate.get(day) || [];
      // ensure the calendar receives objects with a `start` property
      arr.push(typeof slot === 'string' ? { start: iso } : { start: iso, ...slot });
      byDate.set(day, arr);
    } catch (e) {
      // ignore malformed
    }
  });

  return (
    <div className="grid grid-cols-1 sm:grid-cols-7 gap-2">
      {days.map(d => {
        const key = d.toISOString().slice(0, 10);
        const slots = byDate.get(key) || [];
        return (
          <div key={key} className="p-2 border rounded text-sm">
            <div className="font-medium">{d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</div>
            {slots.length === 0 ? (
              <div className="text-xs text-muted-foreground">No slots</div>
            ) : (
              <div className="mt-2 flex flex-col gap-1">
                {slots.map((s: any, i: number) => (
                  <button key={i} onClick={() => onSelect?.(s)} className="text-xs px-2 py-1 bg-primary/10 rounded">{new Date(s.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</button>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default AvailabilityCalendar;
