import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '@/services/api';

const SessionsList = () => {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    apiClient.get('/sessions').then((data: any) => { if (mounted) setSessions(data || []); }).catch(() => {}).finally(() => mounted && setLoading(false));
    return () => { mounted = false };
  }, []);

  if (loading) return <div className="p-4">Loading sessions...</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Sessions</h1>
      <div className="space-y-3">
        {sessions.map(s => (
          <div key={s._id} className="p-3 border rounded">
            <div className="font-semibold">{s.title}</div>
            <div className="text-sm text-muted">{s.description}</div>
          </div>
        ))}
      </div>
      {/* Create session removed for now */}
    </div>
  );
};

export default SessionsList;
