import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import authService from '@/services/authService';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import GoogleSignInButton from '@/components/GoogleSignInButton';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const auth = useAuth();

  // Show friendly message if redirected due to session expiry (401) or CSRF (403)
  useState(() => {
    try {
      const reason = sessionStorage.getItem('auth:reason');
      if (reason === 'session_expired' || reason === 'session_expired_csrf') {
        toast({ title: 'Session expired', description: 'Please sign in again' });
        sessionStorage.removeItem('auth:reason');
      }
    } catch (e) {
      // ignore
    }
  });

  const validate = () => {
    if (!email || !email.includes('@')) return 'Please enter a valid email address.';
    if (!password || password.length < 6) return 'Password must be at least 6 characters.';
    return null;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const v = validate();
    if (v) {
      setError(v);
      return;
    }
    setLoading(true);
    try {
    const resp = await authService.login({ email, password });
    // resp might be axios-style (resp.data) or already the data; cast to any to safely access both shapes
    const respAny: any = resp;
    const data: any = respAny?.data ?? respAny;
  const token = data?.token ?? data?.data?.token ?? data?.accessToken ?? null;
  const user = data?.user ?? data?.data?.user ?? null;

  if (!token) throw new Error('Authentication failed: token not received');

  // update auth context (AuthProvider will persist to localStorage)
  auth.login(token, user);
  toast({ title: 'Signed in', description: 'Welcome back!' });
      // Prefer dashboard route if exists, otherwise profile
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? err?.message ?? 'Login failed. Check credentials and try again.';
      setError(msg);
      toast({ title: 'Sign in failed', description: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-background py-12">
      <section className="w-full max-w-lg p-8 bg-card rounded-lg shadow-md" aria-labelledby="login-heading">
        <h1 id="login-heading" className="text-2xl font-semibold mb-2">Welcome back</h1>
        <p className="text-sm text-muted-foreground mb-6">Sign in to access your dashboard and manage your profile</p>

        <Tabs defaultValue="google" className="mt-2">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="google">Google</TabsTrigger>
            <TabsTrigger value="email">Email</TabsTrigger>
          </TabsList>

          <TabsContent value="google" className="mt-6">
            <div className="flex flex-col items-center gap-3">
              <GoogleSignInButton className="w-full" label="Continue with Google" />
              <p className="text-xs text-muted-foreground text-center">
                Recommended for best experience. We’ll keep you signed in using a secure cookie.
              </p>
              <div className="text-center text-sm text-muted-foreground">
                New here? <Link to="/register" className="text-primary font-medium hover:underline">Create an account</Link>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="email" className="mt-6">
            <form onSubmit={submit} className="space-y-4" noValidate>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-foreground">Email</label>
                <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} aria-required="true" aria-label="Email address" />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-foreground">Password</label>
                <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} aria-required="true" aria-label="Password" />
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox checked={remember} onCheckedChange={(v) => setRemember(Boolean(v))} />
                  <span>Remember me</span>
                </label>
                <Link to="/forgot-password" className="text-sm text-primary hover:underline">Forgot password?</Link>
              </div>

              {error && <div role="alert" className="text-sm text-destructive">{error}</div>}

              <div>
                <Button type="submit" className="w-full" size="lg" aria-label="Sign in" disabled={loading}>
                  {loading ? 'Signing in...' : 'Sign in'}
                </Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </section>
    </main>
  );
};

export default Login;
