import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import resourceService from '@/services/resourceService';

const ResourcesList = () => {
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    resourceService.getAllResources().then(data => { if (mounted) setResources(data || []); }).catch(() => {}).finally(() => mounted && setLoading(false));
    return () => { mounted = false };
  }, []);

  if (loading) return <div className="p-4">Loading resources...</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Resources</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {resources.map(r => (
          <div key={r._id} className="p-4 border rounded">
            <h3 className="text-lg font-semibold">{r.title}</h3>
            <p className="text-sm text-muted">{r.description}</p>
            <Link to={`/resources/${r._id}`} className="text-primary mt-2 inline-block">View</Link>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ResourcesList;
