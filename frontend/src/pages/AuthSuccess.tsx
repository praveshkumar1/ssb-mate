import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const AuthSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const auth = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');
    // If older flow provided token in query, use it for backward compatibility
    if (token) {
      auth.login(token, null);
      navigate('/dashboard', { replace: true });
      return;
    }

    // Otherwise, use cookie session: call backend profile endpoint to hydrate user
    (async () => {
      try {
        const resp = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8080/api'}/users/profile`, { credentials: 'include' });
        if (resp.ok) {
          const json = await resp.json();
          const user = json.data || json;
          auth.login('', user);
          navigate('/dashboard', { replace: true });
          return;
        }
      } catch (e) {
        // ignore
      }
      navigate('/login', { replace: true });
    })();
  }, [auth, navigate, searchParams]);

  return <div className="min-h-screen flex items-center justify-center">Signing you in…</div>;
};

export default AuthSuccess;
