import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import authService from '@/services/authService';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import GoogleSignInButton from '@/components/GoogleSignInButton';
import Spinner from '@/components/ui/Spinner';

const Register = () => {
  const [form, setForm] = useState<any>({ email: '', password: '', firstName: '', lastName: '', role: 'mentee' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const auth = useAuth();

  // Show friendly message if redirected due to CSRF/session expiry
  useState(() => {
    try {
      const reason = sessionStorage.getItem('auth:reason');
      if (reason === 'session_expired_csrf') {
        toast({ title: 'Session expired', description: 'Please sign in again' });
        sessionStorage.removeItem('auth:reason');
      }
    } catch (e) {
      // ignore
    }
  });

  const handleChange = (k: string, v: any) => setForm(prev => ({ ...prev, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const resp = await authService.register(form as any);
      const respAny: any = resp;
      const data: any = respAny?.data ?? respAny;
      // New flow: backend sends verification email; no token yet
      toast({ title: 'Almost there', description: 'We sent a verification code to your email.' });
      navigate(`/verify-email?email=${encodeURIComponent(form.email)}`, { replace: true });
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? err?.message ?? 'Registration failed';
      setError(msg);
      toast({ title: 'Registration failed', description: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-background py-12">
      <section className="w-full max-w-lg p-8 bg-card rounded-lg shadow-md" aria-labelledby="register-heading">
        <h1 id="register-heading" className="text-2xl font-semibold mb-2">Create an account</h1>
        <p className="text-sm text-muted-foreground mb-6">Sign up to access coaching, sessions, and your dashboard</p>

        <Tabs defaultValue="google">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="google">Google</TabsTrigger>
            <TabsTrigger value="email">Email</TabsTrigger>
          </TabsList>

          <TabsContent value="google" className="mt-6">
            <div className="flex flex-col items-center gap-3">
              <GoogleSignInButton className="w-full" label="Sign up with Google" />
              <p className="text-xs text-muted-foreground text-center">
                Google is recommended for the best experience. You’ll set your role and complete onboarding after signing in.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="email" className="mt-6">
            <form onSubmit={submit} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-3">
                <Input placeholder="First name" value={form.firstName} onChange={e => handleChange('firstName', e.target.value)} />
                <Input placeholder="Last name" value={form.lastName} onChange={e => handleChange('lastName', e.target.value)} />
              </div>
              <Input placeholder="Email" type="email" value={form.email} onChange={e => handleChange('email', e.target.value)} />
              <Input placeholder="Password" type="password" value={form.password} onChange={e => handleChange('password', e.target.value)} />

              <div>
                <label className="block text-sm font-medium mb-2">Role</label>
                <select value={form.role} onChange={e => handleChange('role', e.target.value)} className="w-full rounded border px-3 py-2">
                  <option value="mentee">Mentee</option>
                  <option value="mentor">Mentor</option>
                </select>
              </div>

              {error && <div role="alert" className="text-sm text-destructive">{error}</div>}

              <div>
                <Button type="submit" className="w-full" size="lg" disabled={loading}>
                  {loading ? (<><Spinner className="w-4 h-4"/> Creating...</>) : 'Create account'}
                </Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account? <Link to="/login" className="text-primary font-medium hover:underline">Sign in</Link>
        </div>
      </section>
    </main>
  );
};

export default Register;
