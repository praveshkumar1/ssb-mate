import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import authService from '@/services/authService';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
      const token = data?.token ?? data?.data?.token ?? null;
      const user = data?.user ?? data?.data?.user ?? null;

      if (!token) throw new Error('Registration failed (no token)');

  // update auth context (AuthProvider will persist to localStorage)
      // store token & user and update context
      auth.login(token, user);

      // wait briefly for localStorage and AuthContext to settle so the protected onboarding route is accessible
      // show a small wait animation during this time
      await new Promise(resolve => setTimeout(resolve, 500));

      if (user?.role === 'mentor') {
        toast({ title: 'Welcome, mentor', description: 'Let\'s finish your mentor profile' });
        navigate('/onboard/mentor', { replace: true });
      } else {
        toast({ title: 'Registered', description: 'Account created, redirecting to dashboard' });
        navigate('/dashboard', { replace: true });
      }
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
                We currently support new registrations via Google only. You’ll set your role and complete onboarding after signing in.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="email" className="mt-6">
            <Alert>
              <AlertDescription>
                Email sign-up is temporarily disabled. Please use "Sign up with Google". If you already created an email account earlier, you can sign in from the Login page.
              </AlertDescription>
            </Alert>

            <form onSubmit={submit} className="space-y-4 mt-4 opacity-60 pointer-events-none" aria-disabled>
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
                <Button type="submit" className="w-full" size="lg" disabled>
                  <Spinner className="w-4 h-4"/> Create account
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
