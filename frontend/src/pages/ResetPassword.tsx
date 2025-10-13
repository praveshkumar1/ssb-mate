import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/services/api';

const ResetPassword = () => {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiClient.post('/auth/reset-password', { email, code, newPassword });
      toast({ title: 'Password reset', description: 'You can now sign in.' });
      navigate('/login');
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Reset failed', description: e?.message || 'Invalid code or password' });
    } finally { setLoading(false); }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-background py-12">
      <section className="w-full max-w-md p-8 bg-card rounded-lg shadow-md">
        <h1 className="text-2xl font-semibold mb-2">Reset password</h1>
        <p className="text-sm text-muted-foreground mb-6">Use the code we emailed you.</p>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium">Email</label>
            <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div>
            <label htmlFor="code" className="block text-sm font-medium">Reset code</label>
            <Input id="code" value={code} onChange={e => setCode(e.target.value)} placeholder="6-digit code" />
          </div>
          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium">New password</label>
            <Input id="newPassword" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={loading}>{loading ? 'Resetting...' : 'Reset password'}</Button>
          </div>
        </form>
      </section>
    </main>
  );
};

export default ResetPassword;
