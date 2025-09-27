import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '@/services/api';

const ChooseRole = () => {
  const [role, setRole] = useState<'mentor' | 'mentee'>('mentee');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = async () => {
    setLoading(true);
    try {
      const data = await apiClient.post('/users/choose-role', { role });
      // If mentor, go to mentor onboarding; otherwise dashboard
      if (role === 'mentor') {
        navigate('/onboard/mentor', { replace: true });
      } else {
        navigate('/onboard/mentee', { replace: true });
      }
    } catch (e) {
      // show simple alert for now
      alert('Failed to set role. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-16 p-6 bg-white rounded shadow">
      <h2 className="text-xl font-semibold mb-4">Welcome — choose your role</h2>
      <p className="mb-4">Are you signing up as a mentor or a mentee? You can change this later in your profile.</p>
      <div className="flex gap-4 mb-6">
        <label className={`p-4 border rounded cursor-pointer flex-1 ${role === 'mentor' ? 'border-blue-500' : ''}`}>
          <input type="radio" name="role" value="mentor" checked={role === 'mentor'} onChange={() => setRole('mentor')} /> Mentor
        </label>
        <label className={`p-4 border rounded cursor-pointer flex-1 ${role === 'mentee' ? 'border-blue-500' : ''}`}>
          <input type="radio" name="role" value="mentee" checked={role === 'mentee'} onChange={() => setRole('mentee')} /> Mentee
        </label>
      </div>
      <div className="flex justify-end">
        <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={submit} disabled={loading}>
          {loading ? 'Saving…' : 'Continue'}
        </button>
      </div>
    </div>
  );
};

export default ChooseRole;
