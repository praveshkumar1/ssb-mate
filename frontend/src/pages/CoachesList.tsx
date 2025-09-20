import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import coachService from '@/services/coachService';

const CoachesList = () => {
  const [coaches, setCoaches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    coachService.getAllCoaches().then(data => {
      if (mounted) setCoaches(data || []);
    }).catch(() => {}).finally(() => mounted && setLoading(false));
    return () => { mounted = false };
  }, []);

  if (loading) return <div className="p-4">Loading coaches...</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Coaches</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {coaches.map(c => {
          const coachId = c._id ?? c.id;
          return (
            <div key={coachId || Math.random()} className="p-4 border rounded">
              <h3 className="text-lg font-semibold">{c.firstName} {c.lastName}</h3>
              <p className="text-sm text-muted">{c.bio}</p>
              {coachId ? (
                <Link to={`/coaches/${coachId}`} className="text-primary mt-2 inline-block">View profile</Link>
              ) : (
                <span className="text-sm text-muted mt-2 inline-block">Profile not available</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CoachesList;
