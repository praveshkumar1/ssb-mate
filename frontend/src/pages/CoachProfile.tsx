import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import coachService from '@/services/coachService';
import sessionService from '@/services/sessionService';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import AvailabilityCalendar from '@/components/coach/AvailabilityCalendar';
import BookingModal from '@/components/coach/BookingModal';
import ManageAvailabilityPanel from '@/components/coach/ManageAvailabilityPanel';
import { useAuth } from '@/contexts/AuthContext';
import Rating from '@/components/ui/Rating';

const CoachProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [coach, setCoach] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<any | null>(null);
  const [selectedSessionType, setSelectedSessionType] = useState<any | null>(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [upcomingSessions, setUpcomingSessions] = useState<any[]>([]);
  const [pastSessions, setPastSessions] = useState<any[]>([]);
  const [ratingDraft, setRatingDraft] = useState<Record<string, number>>({});
  const [feedbackDraft, setFeedbackDraft] = useState<Record<string, string>>({});
  const routerLocation = useLocation();
  const auth = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const res: any = await coachService.getCoachById(id);
        if (res && res.success && Array.isArray(res.data)) {
          setCoach(res.data[0] ?? null);
        } else if (res && res.data) {
          setCoach(res.data ?? null);
        } else {
          setCoach(res ?? null);
        }
        // fetch upcoming and past sessions for this coach
        try {
          const ups: any = await sessionService.getSessions({ mentorId: id, type: 'upcoming' });
          setUpcomingSessions(ups?.data ?? ups ?? []);
        } catch (e) {
          setUpcomingSessions([]);
        }
        try {
          const ps: any = await sessionService.getSessions({ mentorId: id, type: 'past' });
          setPastSessions(ps?.data ?? ps ?? []);
        } catch (e) {
          setPastSessions([]);
        }
      } catch (e) {
        // ignore — handled by loading state
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  // Availability local to this component (declare early so hooks order is stable)
  const availability = coach?.availability || [];

  // Dev-only demo slots so colors are visible when there are no real slots
  const demoAvailability = useMemo(() => {
    if (availability && availability.length > 0) return [] as any[];
    if (!(import.meta as any).env?.DEV) return [] as any[];
    const mk = (d: Date, h: number, opts?: any) => {
      const t = new Date(d);
      t.setHours(h, 0, 0, 0);
      return { start: t.toISOString(), ...opts };
    };
    const base = new Date();
    base.setDate(base.getDate() + 1); // tomorrow
    const day2 = new Date(base);
    day2.setDate(day2.getDate() + 1);

    return [
      mk(base, 9),                      // available (morning)
      mk(base, 15, { booked: true }),   // booked (afternoon)
      mk(base, 19, { available: false }), // unavailable (evening)
      mk(day2, 9),
      mk(day2, 15),
      mk(day2, 19),
    ];
  }, [availability]);

  // if URL contains ?focus=availability, open the booking modal or scroll (run after availability is known)
  useEffect(() => {
    const params = new URLSearchParams(routerLocation.search);
    if (params.get('focus') === 'availability') {
      if (availability.length > 0) {
        setSelectedSlot(availability[0]);
        setModalOpen(true);
      } else {
        setTimeout(() => {
          const el = document.querySelector('#availability-section');
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 300);
      }
    }
  }, [routerLocation.search, availability]);

  if (loading) return <div className="p-6">Loading coach...</div>;
  if (!id) return <div className="p-6">No coach selected</div>;
  if (!coach) return <div className="p-6">Coach not found</div>;

  // map API fields to local variables using the sample shape provided
  const coachId = coach?.id ?? coach?._id ?? id;
  const name = (coach?.name) || `${coach?.firstName || ''} ${coach?.lastName || ''}`.trim() || 'Coach';
  const avatar = coach?.profileImageUrl || coach?.profileImageUrl || '/avatars/soldier_male.png';
  const title = coach?.title || coach?.role || '';
  const place = coach?.location || '';
  const bio = coach?.bio || '';
  const specializations = coach?.specializations || [];
  const testimonials = coach?.testimonials || [];
  const rate = (coach as any)?.hourlyRate ?? coach?.rate ?? null;
  const email = coach?.email || '';
  const phone = coach?.phoneNumber || '';
  const isVerified = Boolean(coach?.isVerified);
  const isActive = Boolean(coach?.isActive);


  const sessionTypes: Array<{id: string; label: string; minutes: number; price: number | null}> = [];
  // Single base hourly rate for computing derived prices if explicit price is not provided
  const baseRate = (coach as any)?.hourlyRate ?? (coach as any)?.rate ?? null;

  // If the coach provides structured sessionTypes, prefer those
  const derivedSessionTypes = (() => {
    if (Array.isArray((coach as any)?.sessionTypes) && (coach as any).sessionTypes.length > 0) {
      return (coach as any).sessionTypes.map((st: any, i: number) => {
        const minutes = st.minutes || st.duration || 60;
        const computed = typeof baseRate === 'number' ? Math.round((baseRate / 60) * minutes) : null;
        const price = typeof st.price === 'number' ? st.price : (typeof st.amount === 'number' ? st.amount : computed);
        return {
          id: st.id || `s-${i}`,
          label: st.label || `${minutes} min`,
          minutes,
          price,
        };
      });
    }

    // fallback: use coach.hourlyRate or rate to compute prices for common durations
    if (typeof baseRate === 'number') {
      // hourlyRate is per hour; compute for 30/60/90
      return [
        { id: 's-30', label: '30 min', minutes: 30, price: Math.round((baseRate / 60) * 30) },
        { id: 's-60', label: '60 min', minutes: 60, price: Math.round((baseRate / 60) * 60) },
        { id: 's-90', label: '90 min', minutes: 90, price: Math.round((baseRate / 60) * 90) },
      ];
    }

    // default when no rate info: show empty list so the UI displays "Custom"
    return [] as any[];
  })();

  return (
    <div className="container mx-auto p-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-2">
          <div className="flex items-center gap-4">
            <img src={avatar} alt={`${name} avatar`} className="h-24 w-24 rounded-full object-cover" />
            <div>
              <h1 className="text-2xl font-bold">{name}</h1>
              <div className="text-sm text-muted-foreground">{title}</div>
              <div className="mt-2 text-sm">{place}</div>
            </div>
          </div>

          <div className="mt-6 prose max-w-none">
            <h2>About</h2>
            <p>{bio || 'No bio available.'}</p>

            <h3 className="mt-4">Specializations</h3>
            <div className="flex flex-wrap gap-2 mt-2">
              {specializations.map((s: string) => (
                <span key={s} className="px-3 py-1 bg-muted rounded text-sm">{s}</span>
              ))}
            </div>

            {testimonials && testimonials.length > 0 && (
              <>
                <h3 className="mt-6">Testimonials</h3>
                <div className="space-y-4 mt-2">
                  {testimonials.map((t: any, i: number) => (
                    <blockquote key={i} className="p-4 border-l-4 border-primary bg-muted">
                      <div className="text-sm">{t.text}</div>
                      <div className="mt-2 text-xs text-muted-foreground">— {t.author}</div>
                    </blockquote>
                  ))}
                </div>
              </>
            )}

            <div className="mt-6" id="availability-section">
              <h3>Availability</h3>
              <div className="mt-3">
                <AvailabilityCalendar availability={availability?.length ? availability : demoAvailability} onSelect={(s) => { setSelectedSlot(s); setModalOpen(true); }} />
              </div>

              {/* If the logged-in user is the coach, allow editing availability inline */}
              {auth?.user?.id && String(auth.user.id) === String(coachId) && (
                <div className="mt-4">
                  <ManageAvailabilityPanel profile={coach} onUpdate={(newAvail) => setCoach((c: any) => ({ ...c, availability: newAvail }))} />
                </div>
              )}
            </div>
          </div>
        </div>

        <aside className="col-span-1">
          <div className="p-4 border rounded space-y-4">
            <div className="text-sm text-muted-foreground">Book a session</div>
            <div className="mt-3">
              <div className="text-lg font-semibold">{rate ? `₹${rate}` : 'Custom'}</div>
              <div className="text-xs text-muted-foreground">per hour</div>
            </div>

            <div className="mt-4">
              <div className="space-y-2">
                {derivedSessionTypes.map(st => (
                  <button key={st.id} onClick={() => { setSelectedSlot(null); setSelectedSessionType(st); setModalOpen(true); }} className="w-full text-left p-3 border rounded hover:shadow-sm transition">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{st.label}</div>
                        <div className="text-xs text-muted-foreground">{st.minutes} minutes</div>
                      </div>
                      <div className="text-sm font-semibold">{st.price ? `₹${st.price}` : 'Custom'}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 text-sm text-muted-foreground">
              <div><strong>Availability</strong></div>
              <div className="mt-2">Use the calendar to pick an available slot.</div>
            </div>
          </div>
          <div className="mt-4 p-4 border rounded">
            <div className="text-sm font-semibold">Upcoming sessions</div>
            {upcomingSessions.length === 0 ? (
              <div className="text-xs text-muted-foreground mt-2">No upcoming sessions</div>
            ) : (
              <ul className="mt-2 space-y-2 text-sm">
                {upcomingSessions.map(s => (
                  <li key={s.id || s._id} className="p-2 border rounded">{new Date(s.scheduledAt).toLocaleString()} — {s.title}</li>
                ))}
              </ul>
            )}
          </div>

          <div className="mt-4 p-4 border rounded">
            <div className="text-sm font-semibold">Past sessions</div>
            {pastSessions.length === 0 ? (
              <div className="text-xs text-muted-foreground mt-2">No past sessions</div>
            ) : (
              <ul className="mt-2 space-y-2 text-sm">
                {pastSessions.map(s => (
                  <li key={s.id || s._id} className="p-2 border rounded">
                    <div>{new Date(s.scheduledAt).toLocaleString()} — {s.title}</div>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="text-xs text-muted-foreground">Your rating:</div>
                      <Rating value={s.menteeRating ?? s.mentorRating ?? 0} readOnly={false} onChange={(v) => setRatingDraft(d => ({ ...d, [s._id]: v }))} />
                      <input placeholder="Add feedback (optional)" value={feedbackDraft[s._id] || ''} onChange={e => setFeedbackDraft(d => ({ ...d, [s._id]: e.target.value }))} className="ml-2 p-1 border rounded text-sm" />
                      <button className="ml-2 px-2 py-1 border rounded text-sm" onClick={async () => {
                        const id = s._id || s.id;
                        const rt = ratingDraft[id];
                        const fb = feedbackDraft[id] || '';
                        if (!rt) {
                          toast({ title: 'Please select a rating', description: 'Choose 1-5 stars' });
                          return;
                        }
                        try {
                          await sessionService.updateSession(id, { menteeRating: rt, menteeFeedback: fb });
                          toast({ title: 'Thanks for the feedback', description: 'Your rating was saved' });
                          // refresh past sessions
                          try { const ps: any = await sessionService.getSessions({ mentorId: coachId, type: 'past' }); setPastSessions(ps?.data ?? ps ?? []); } catch(e){}
                          // notify others
                          window.dispatchEvent(new CustomEvent('sessions:changed'));
                        } catch (e: any) {
                          toast({ title: 'Save failed', description: e?.message || 'Could not save rating' });
                        }
                      }}>Submit</button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>

        <BookingModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          selectedSlot={selectedSlot}
          sessionTypes={derivedSessionTypes}
          initialSessionType={selectedSessionType}
          coachName={name}
          confirmLoading={bookingLoading}
          onConfirm={async (payload) => {
                setBookingLoading(true);
                try {
                  const payloadBody: any = {
                    title: `${payload.sessionType?.label || 'Session'} with ${name}`,
                    description: payload.description || '', // visible only to the booking user
                    mentorId: coachId,
                    menteeId: auth.user?.id,
                    // prefer explicit category (one of backend allowed values), fall back to general_mentoring
                    sessionType: payload.category || payload.sessionType?.id || 'general_mentoring',
                    duration: payload.sessionType?.minutes || 60,
                    scheduledAt: payload.slot?.start ? new Date(payload.slot.start).toISOString() : undefined,
                    price: payload.sessionType?.price || null,
                  };

                  const created = await sessionService.createSession(payloadBody);
                  toast({ title: 'Session booked', description: 'Your session was created successfully' });

                  // Refresh coach data from server to pick up backend-updated availability
                  try {
                    const fresh = await coachService.getCoachById(coachId as string);
                    const anyFresh: any = fresh;
                    if (anyFresh && anyFresh.data) {
                      setCoach(Array.isArray(anyFresh.data) ? anyFresh.data[0] : anyFresh.data);
                    } else if (anyFresh) {
                      setCoach(anyFresh);
                    }
                  } catch (err) {
                    // fallback: remove booked slot locally
                    const bookedIso = payload.slot?.start ? new Date(payload.slot.start).toISOString() : null;
                    if (bookedIso) {
                      setCoach((c: any) => ({ ...c, availability: (c.availability || []).filter((a: any) => {
                        const iso = typeof a === 'string' ? a : (a.start || a.iso || null);
                        return iso !== bookedIso;
                      }) }));
                    }
                  }

                  // Refresh auth user data (so user's profile shows the booked session)
                  auth.refresh();
                  // Notify other parts of the app (dashboard) that sessions changed
                  try { window.dispatchEvent(new CustomEvent('sessions:changed')); } catch (e) { /* ignore */ }
                  setModalOpen(false);
                } catch (err: any) {
                  console.error('Booking failed', err);
                  toast({ title: 'Booking failed', description: err?.message || 'Could not create session' });
                } finally {
                  setBookingLoading(false);
                }
          }}
        />
      </div>
    </div>
  );
};

export default CoachProfile;
