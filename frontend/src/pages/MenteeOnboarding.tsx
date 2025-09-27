import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import userService from '@/services/userService';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import TagInput from '@/components/ui/TagInput';

const MenteeOnboarding = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<any>({ education: '', achievements: [] as string[], bio: '' });
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
            education: data.education ?? '',
            achievements: Array.isArray(data.achievements) ? data.achievements : (data.achievements ? data.achievements.split(',').map((s: string) => s.trim()) : []),
            bio: data.bio ?? ''
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
      const payload: any = {};
      if (step === 1 && form.education) payload.education = form.education;
      if (step === 2 && Array.isArray(form.achievements) && form.achievements.length) payload.achievements = form.achievements;
      if (step === 3 && form.bio) payload.bio = form.bio;

      if (Object.keys(payload).length) {
        await userService.updateProfile(payload);
        toast({ title: 'Saved', description: `Step ${step} saved successfully` });
      } else {
        toast({ title: 'Skipped', description: `No changes to save for step ${step}` });
      }

      if (step < 3) setStep(s => s + 1);
      else navigate('/dashboard', { replace: true });
    } catch (err: any) {
      console.error('Failed to save mentee onboarding step', err);
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
    if (step < 3) setStep(s => s + 1);
    else navigate('/dashboard', { replace: true });
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-background py-12">
      <section className="w-full max-w-2xl p-8 bg-card rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Mentee setup — Step {step} of 3</h2>

        {step === 1 && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Highest education (optional)</p>
            <Input placeholder="e.g. B.Sc. Computer Science" value={form.education} onChange={e => handleChange('education', e.target.value)} />
            {errors.education && <div role="alert" className="text-sm text-destructive">{errors.education}</div>}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Achievements you'd like to highlight (optional)</p>
            <TagInput id="mentee-achievements" placeholder="Add achievement and press Enter" value={form.achievements} onChange={(v) => handleChange('achievements', v)} />
            {errors.achievements && <div role="alert" className="text-sm text-destructive">{errors.achievements}</div>}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Short bio (optional)</p>
            <textarea className="w-full p-2 border rounded" value={form.bio} onChange={e => handleChange('bio', e.target.value)} rows={6} />
            {errors.bio && <div role="alert" className="text-sm text-destructive">{errors.bio}</div>}
          </div>
        )}

        <div className="mt-6 flex gap-3">
          {step > 1 && <Button variant="outline" onClick={() => setStep(s => s - 1)}>Back</Button>}
          <Button variant="ghost" onClick={skipStep} disabled={saving}>Skip</Button>
          <Button onClick={saveStep} disabled={saving}>{saving ? 'Saving...' : step < 3 ? 'Save & Continue' : 'Finish'}</Button>
        </div>
      </section>
    </main>
  );
};

export default MenteeOnboarding;
