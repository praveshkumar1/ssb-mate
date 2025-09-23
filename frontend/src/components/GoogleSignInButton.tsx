import React from 'react';

type Props = {
  className?: string;
};

const GoogleSignInButton: React.FC<Props> = ({ className }) => {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const redirectUri = import.meta.env.VITE_GOOGLE_REDIRECT_URI || `${window.location.origin}/api/auth/google/callback`;
  const params = new URLSearchParams({
    client_id: clientId || '',
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid profile email',
    access_type: 'offline',
    prompt: 'consent'
  });

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

  return (
    <a href={authUrl} className={`inline-flex items-center justify-center gap-2 px-4 py-2 border rounded bg-white text-sm ${className || ''}`}>
      <img src="/google-logo.svg" alt="Google" className="h-5 w-5" />
      Sign in with Google
    </a>
  );
};

export default GoogleSignInButton;
