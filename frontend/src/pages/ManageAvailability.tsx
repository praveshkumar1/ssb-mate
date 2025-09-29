import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ManageAvailabilityPanel from '@/components/coach/ManageAvailabilityPanel';
import { apiClient } from '@/services/api';
import Spinner from '@/components/ui/Spinner';

const ManageAvailability: React.FC = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const resp: any = await apiClient.get('/users/profile');
        if (!mounted) return;
        const p = resp?.data ?? resp;
        setProfile(p);
      } catch (e: any) {
        if (e?.status === 401) navigate('/login');
      } finally { mounted && setLoading(false); }
    })();
    return () => { mounted = false; };
  }, [navigate]);

  if (loading) return <div className="p-6"><Spinner className="w-4 h-4" /> Loading...</div>;
  if (!profile) return <div className="p-6">Profile not found</div>;

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold">Manage Availability</h1>
      <p className="text-sm text-muted-foreground">Add or remove availability windows that students can book.</p>
      <div className="mt-4">
        <ManageAvailabilityPanel profile={profile} onUpdate={(avail) => setProfile((p: any) => ({ ...p, availability: avail }))} />
      </div>
    </div>
  );
};

export default ManageAvailability;
