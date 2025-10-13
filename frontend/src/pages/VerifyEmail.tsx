import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/services/api';

const VerifyEmail = () => {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const resp: any = await apiClient.post('/auth/verify-email', { email, code });
      // On success, server issues session; redirect to onboarding flow consistent with Google
      toast({ title: 'Verified', description: 'Email verified and signed in.' });
      navigate('/auth/success?created=1', { replace: true });
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Verification failed', description: e?.message || 'Invalid or expired code' });
    } finally { setLoading(false); }
  };

  const resend = async () => {
    try {
      await apiClient.post('/auth/resend-code', { email });
      toast({ title: 'Code sent', description: 'Check your email for the verification code.' });
    } catch {}
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-background py-12">
      <section className="w-full max-w-md p-8 bg-card rounded-lg shadow-md">
        <h1 className="text-2xl font-semibold mb-2">Verify your email</h1>
        <p className="text-sm text-muted-foreground mb-6">Enter the code we sent to your email.</p>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium">Email</label>
            <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div>
            <label htmlFor="code" className="block text-sm font-medium">Code</label>
            <Input id="code" value={code} onChange={e => setCode(e.target.value)} placeholder="6-digit code" />
          </div>
          <div className="flex justify-between items-center">
            <Button type="button" variant="ghost" onClick={resend}>Resend code</Button>
            <Button type="submit" disabled={loading}>{loading ? 'Verifying...' : 'Verify'}</Button>
          </div>
        </form>
      </section>
    </main>
  );
};

export default VerifyEmail;
