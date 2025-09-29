import React from 'react';

// Minimal shape for a time slot; supports multiple backend variants
export interface Slot {
  start: string; // ISO timestamp
  end?: string; // optional ISO end for windows
  available?: boolean;
  isAvailable?: boolean;
  booked?: boolean;
  isBooked?: boolean;
  status?: 'available' | 'unavailable' | 'booked' | string;
  // ...other optional fields we ignore for rendering
  [key: string]: unknown;
}

type Props = {
  availability?: Array<Slot | string>; // supports single ISO, range "start|end", or objects with {start,end}
  onSelect?: (slot: Slot) => void;
  daysToShow?: number; // how many days forward to show (default 14)
  slotDurationMinutes?: number; // step when expanding ranges (default 30)
};

const AvailabilityCalendar: React.FC<Props> = ({ availability = [], onSelect, daysToShow = 14, slotDurationMinutes = 30 }) => {
  // show next N days with available slots
  const days = Array.from({ length: daysToShow }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
  });

  // expand availability entries into discrete slots and group by date
  const byDate = new Map<string, Slot[]>();
  const stepMs = Math.max(15, slotDurationMinutes) * 60_000; // minimum 15 min to avoid too-small steps

  const pushSlot = (s: Slot) => {
    try {
      const day = new Date(s.start).toISOString().slice(0, 10);
      const arr = byDate.get(day) || [];
      arr.push(s);
      byDate.set(day, arr);
    } catch {}
  };

  const expandWindow = (startIso: string, endIso: string, base: Partial<Slot> = {}) => {
    const start = new Date(startIso).getTime();
    const end = new Date(endIso).getTime();
    if (Number.isNaN(start) || Number.isNaN(end) || end <= start) return;
    for (let t = start; t < end; t += stepMs) {
      const slotStart = new Date(t).toISOString();
      const slotEnd = new Date(Math.min(t + stepMs, end)).toISOString();
      pushSlot({ start: slotStart, end: slotEnd, status: 'available', ...base });
    }
  };

  availability.forEach((entry: Slot | string) => {
    try {
      if (typeof entry === 'string') {
        if (entry.includes('|')) {
          const [s, e] = entry.split('|');
          if (s && e) expandWindow(s, e);
        } else {
          const dt = new Date(entry);
          if (!Number.isNaN(dt.getTime())) pushSlot({ start: dt.toISOString() });
        }
        return;
      }
      // object with potential start/end
      const s = (entry as any).start || (entry as any).iso || null;
      const e = (entry as any).end || (entry as any).until || null;
      if (s && e) {
        const base: Partial<Slot> = {
          available: (entry as any).available,
          isAvailable: (entry as any).isAvailable,
          booked: (entry as any).booked,
          isBooked: (entry as any).isBooked,
          status: (entry as any).status,
        };
        expandWindow(s, e, base);
      } else if (s) {
        pushSlot({ start: new Date(s).toISOString(), end: e ? new Date(e).toISOString() : undefined, ...(entry as Slot) });
      }
    } catch {}
  });

  const colorForSlot = (dateIso: string) => {
    const dt = new Date(dateIso);
    const h = dt.getHours();
    if (h < 12) return 'bg-emerald-200 text-emerald-900 border border-emerald-400 hover:bg-emerald-300'; // morning
    if (h < 17) return 'bg-amber-200 text-amber-900 border border-amber-400 hover:bg-amber-300'; // afternoon
    return 'bg-indigo-200 text-indigo-900 border border-indigo-400 hover:bg-indigo-300'; // evening
  };

  type SlotState = 'available' | 'booked' | 'unavailable';
  const getSlotState = (s: Slot): SlotState => {
    const isPast = new Date(s.start).getTime() < Date.now();
    const isBooked = s.booked || s.isBooked || s.status === 'booked';
    if (isBooked) return 'booked';
    const explicitAvailable = s.available ?? s.isAvailable ?? (typeof s.status === 'string' ? s.status === 'available' : undefined);
    if (explicitAvailable !== undefined) {
      return explicitAvailable ? 'available' : 'unavailable';
    }
    // default: past times are unavailable, future are available
    return isPast ? 'unavailable' : 'available';
  };

  return (
    <div>
      {/* Legend */}
      <div className="flex items-center gap-4 mb-2 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <span className="h-3 w-3 rounded bg-emerald-300 border border-emerald-500"></span>
          Available
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-3 w-3 rounded bg-slate-300 border border-slate-500"></span>
          Booked
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-3 w-3 rounded bg-rose-200 border border-rose-400"></span>
          Not available
        </span>
      </div>

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
                {slots.map((s: Slot, i: number) => {
                  const state = getSlotState(s);
                  const isAvailable = state === 'available';
                  const isBooked = state === 'booked';
                  const color = isAvailable
                    ? colorForSlot(s.start)
                    : isBooked
                      ? 'bg-slate-200 text-slate-900 border border-slate-400'
                      : 'bg-rose-200 text-rose-900 border border-rose-400';
                  return (
                    <button
                      key={i}
                      onClick={() => isAvailable && onSelect?.(s)}
                      disabled={!isAvailable}
                      title={isAvailable ? 'Available' : (isBooked ? 'Booked' : 'Not available')}
                      className={`text-xs px-2 py-1 rounded transition inline-flex items-center justify-center ${color} ${isAvailable ? 'cursor-pointer hover:shadow-sm' : 'cursor-not-allowed'} ${state === 'unavailable' ? 'line-through' : ''}`}
                    >
                      {new Date(s.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
      </div>
    </div>
  );
};

export default AvailabilityCalendar;
