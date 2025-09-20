import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import coachService from '@/services/coachService';

const CoachProfile = () => {
  const { id } = useParams<{ id: string }>();
  const [coach, setCoach] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    coachService.getCoachById(id).then(data => setCoach(data)).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="p-4">Loading coach...</div>;
  if (!id) return <div className="p-4">No coach selected</div>;
  if (!coach) return <div className="p-4">Coach not found</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold">{coach.firstName} {coach.lastName}</h1>
      <p className="text-sm text-muted">{coach.bio}</p>
      <div className="mt-4">
        <strong>Specializations:</strong> {(coach.specializations || []).join(', ')}
      </div>
    </div>
  );
};

export default CoachProfile;
