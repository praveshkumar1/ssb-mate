import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import userService from '@/services/userService';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import TagInput from '@/components/ui/TagInput';

const MentorOnboarding = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<any>({ specializations: [] as string[], achievements: [] as string[], experience: '', skills: [] as string[], hourlyRate: '' });
  const [errors, setErrors] = useState<any>({});

  // fetch current profile to prefill values (optional)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const resp: any = await userService.getProfile();
        const data = resp?.data ?? resp;
        if (!mounted) return;
        if (data) {
          setForm((p: any) => ({
            ...p,
            specializations: Array.isArray(data.specializations) ? data.specializations : (data.specializations ? data.specializations.split(',').map((s: string) => s.trim()) : []),
            achievements: Array.isArray(data.achievements) ? data.achievements : (data.achievements ? data.achievements.split(',').map((s: string) => s.trim()) : []),
            skills: Array.isArray(data.skills) ? data.skills : (data.skills ? data.skills.split(',').map((s: string) => s.trim()) : []),
            experience: data.experience ?? '',
            hourlyRate: data.hourlyRate ?? ''
          }));
        }
      } catch (err) {
        // ignore - profile may not be available yet
      }
    })();
    return () => { mounted = false; };
  }, []);

  const handleChange = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }));

  const saveStep = async () => {
    setSaving(true);
    setErrors({});
    try {
      // client-side validation
      if (step === 2 && form.experience !== '' && Number(form.experience) < 0) {
        toast({ title: 'Invalid experience', description: 'Experience must be a positive number' });
        setSaving(false);
        return;
      }
      if (step === 4 && form.hourlyRate !== '' && Number(form.hourlyRate) < 0) {
        toast({ title: 'Invalid rate', description: 'Hourly rate must be a positive number' });
        setSaving(false);
        return;
      }
      // normalize a few fields before sending
      const payload: any = {};
      if (step === 1 && Array.isArray(form.specializations) && form.specializations.length) payload.specializations = form.specializations;
      if (step === 2) {
        if (Array.isArray(form.achievements) && form.achievements.length) payload.achievements = form.achievements;
        if (form.experience !== '' && form.experience !== null) payload.experience = Number(form.experience) || 0;
      }
      if (step === 3 && Array.isArray(form.skills) && form.skills.length) payload.skills = form.skills;
      if (step === 4 && form.hourlyRate !== '' && form.hourlyRate != null) payload.hourlyRate = Number(form.hourlyRate) || 0;

      // only call API when there is something to save for this step
      if (Object.keys(payload).length) {
        await userService.updateProfile(payload);
        toast({ title: 'Saved', description: `Step ${step} saved successfully` });
      } else {
        toast({ title: 'Skipped', description: `No changes to save for step ${step}` });
      }
      // small step forward
      if (step < 4) setStep(s => s + 1);
      else navigate('/dashboard', { replace: true });
    } catch (err: any) {
      console.error('Failed to save onboarding step', err);
      // try to surface validation errors from the server
      const serverErrors = err?.response?.data?.errors ?? err?.response?.data ?? null;
      if (serverErrors && typeof serverErrors === 'object') {
        setErrors(serverErrors);
        toast({ title: 'Save failed', description: 'Please fix the highlighted fields' });
      } else {
        const msg = err?.response?.data?.message ?? err?.message ?? 'Could not save this step. Please try again.';
        toast({ title: 'Save failed', description: msg });
      }
    } finally {
      setSaving(false);
    }
  };

  const skipStep = () => {
    // advance without saving
    if (step < 4) setStep(s => s + 1);
    else navigate('/dashboard', { replace: true });
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-background py-12">
      <section className="w-full max-w-2xl p-8 bg-card rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Mentor setup — Step {step} of 4</h2>

        {step === 1 && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Tell us about the areas you coach in. (optional)</p>
            <TagInput id="specializations" placeholder="e.g. Career coaching" value={form.specializations} onChange={(v) => handleChange('specializations', v)} suggestions={["Career coaching","Leadership","UX","Product","Engineering","Interview prep","Career transition","Startup","Management"]} />
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Share your achievements and years of experience. (optional)</p>
            <Input placeholder="Years of experience" type="number" value={form.experience} onChange={e => handleChange('experience', e.target.value)} />
            {errors.experience && <div role="alert" className="text-sm text-destructive">{errors.experience}</div>}
            <TagInput id="achievements" placeholder="Add achievement and press Enter" value={form.achievements} onChange={(v) => handleChange('achievements', v)} />
            {errors.achievements && <div role="alert" className="text-sm text-destructive">{errors.achievements}</div>}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">List key skills. (optional)</p>
            <TagInput id="skills" placeholder="e.g. Communication" value={form.skills} onChange={(v) => handleChange('skills', v)} />
            {errors.skills && <div role="alert" className="text-sm text-destructive">{errors.skills}</div>}
          </div>
        )}

        {step === 4 && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Set your hourly rate (USD) — this will be shown to mentees.</p>
            <Input placeholder="Hourly rate" type="number" value={form.hourlyRate} onChange={e => handleChange('hourlyRate', e.target.value)} />
            {errors.hourlyRate && <div role="alert" className="text-sm text-destructive">{errors.hourlyRate}</div>}
          </div>
        )}

        <div className="mt-6 flex gap-3">
          {step > 1 && <Button variant="outline" onClick={() => setStep(s => s - 1)}>Back</Button>}
          <Button variant="ghost" onClick={skipStep} disabled={saving}>Skip</Button>
          <Button onClick={saveStep} disabled={saving}>{saving ? 'Saving...' : step < 4 ? 'Save & Continue' : 'Finish'}</Button>
        </div>
      </section>
    </main>
  );
};

export default MentorOnboarding;
