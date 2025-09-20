import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '@/services/authService';
import { toast } from '@/components/ui/use-toast';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const resp = await authService.login({ email, password });
      // Normalize possible response shapes and extract token/user
  const r: any = resp;
  const token = r?.token ?? r?.data?.token ?? r?.accessToken ?? r?.tokenType ?? null;
  const user = r?.user ?? r?.data?.user ?? r?.userData ?? r ?? null;

      if (!token) {
        // As a fallback, if the API client already unwrapped to the data object with token/user
        if (r && typeof r === 'object' && 'token' in r) {
          authService.storeAuthData(r.token, r.user ?? r);
        } else {
          throw new Error('Authentication response missing token');
        }
      } else {
        authService.storeAuthData(token, user);
      }

      // Navigate to profile edit/view so user sees their profile immediately
      toast({ title: 'Signed in', description: 'Redirecting to your profile' });
      navigate('/profile/edit');
    } catch (err: any) {
      setError(err?.message || 'Login failed');
      toast({ title: 'Sign in failed', description: err?.message || 'Invalid credentials' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md p-6 bg-white rounded shadow">
        <h2 className="text-2xl font-bold mb-4">Login</h2>
        <form onSubmit={submit}>
          <label className="block mb-2">Email</label>
          <input className="w-full mb-3 p-2 border rounded" value={email} onChange={e => setEmail(e.target.value)} />
          <label className="block mb-2">Password</label>
          <input type="password" className="w-full mb-3 p-2 border rounded" value={password} onChange={e => setPassword(e.target.value)} />
          {error && <div className="text-sm text-red-600 mb-2">{error}</div>}
          <button className="w-full py-2 bg-primary text-white rounded" disabled={loading}>{loading ? 'Logging in...' : 'Login'}</button>
        </form>
      </div>
    </div>
  );
};

export default Login;
