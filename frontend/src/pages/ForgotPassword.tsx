import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/services/api';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/auth/forgot-password', { email });
      setSent(true);
      toast({ title: 'Check your email', description: 'We sent a reset code if the email exists.' });
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Error', description: e?.message || 'Failed to send reset code' });
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-background py-12">
      <section className="w-full max-w-md p-8 bg-card rounded-lg shadow-md">
        <h1 className="text-2xl font-semibold mb-2">Forgot password</h1>
        <p className="text-sm text-muted-foreground mb-6">Enter your email to receive a reset code.</p>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium">Email</label>
            <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div className="flex justify-end">
            <Button type="submit">Send code</Button>
          </div>
        </form>
        {sent && (
          <div className="mt-4 text-sm">
            Have a code? <a className="text-primary underline" onClick={() => navigate('/reset-password')}>Reset now</a>
          </div>
        )}
      </section>
    </main>
  );
};

export default ForgotPassword;
