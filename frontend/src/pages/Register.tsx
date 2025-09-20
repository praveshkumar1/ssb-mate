import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '@/services/authService';
import { toast } from '@/components/ui/use-toast';

const Register = () => {
  const [form, setForm] = useState({ email: '', password: '', firstName: '', lastName: '', role: 'mentee' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleChange = (k: string, v: any) => setForm(prev => ({ ...prev, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const resp = await authService.register(form as any);
      const r: any = resp;
      const token = r?.token ?? r?.data?.token ?? null;
      const user = r?.user ?? r?.data?.user ?? r ?? null;

      if (!token) {
        if (r && typeof r === 'object' && 'token' in r) {
          authService.storeAuthData(r.token, r.user ?? r);
        } else {
          throw new Error('Registration response missing token');
        }
      } else {
        authService.storeAuthData(token, user);
      }

      toast({ title: 'Registered', description: 'Account created, redirecting to profile' });
      // Navigate to profile edit so user can complete/update their profile
      navigate('/profile/edit');
    } catch (err: any) {
      setError(err?.message || 'Registration failed');
      toast({ title: 'Registration failed', description: err?.message || 'Unable to create account' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-lg p-6 bg-white rounded shadow">
        <h2 className="text-2xl font-bold mb-4">Register</h2>
        <form onSubmit={submit}>
          <div className="grid grid-cols-2 gap-3">
            <input placeholder="First name" className="p-2 border rounded" value={form.firstName} onChange={e => handleChange('firstName', e.target.value)} />
            <input placeholder="Last name" className="p-2 border rounded" value={form.lastName} onChange={e => handleChange('lastName', e.target.value)} />
          </div>
          <input placeholder="Email" className="w-full mt-3 p-2 border rounded" value={form.email} onChange={e => handleChange('email', e.target.value)} />
          <input placeholder="Password" type="password" className="w-full mt-3 p-2 border rounded" value={form.password} onChange={e => handleChange('password', e.target.value)} />
          <div className="mt-3">
            <label className="mr-2">Role</label>
            <select value={form.role} onChange={e => handleChange('role', e.target.value)}>
              <option value="mentee">Mentee</option>
              <option value="mentor">Mentor</option>
            </select>
          </div>
          {error && <div className="text-sm text-red-600 my-2">{error}</div>}
          <button className="mt-4 w-full py-2 bg-primary text-white rounded" disabled={loading}>{loading ? 'Registering...' : 'Register'}</button>
        </form>
      </div>
    </div>
  );
};

export default Register;
