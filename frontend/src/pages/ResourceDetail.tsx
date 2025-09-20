import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import resourceService from '@/services/resourceService';

const ResourceDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [resource, setResource] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    resourceService.getResourceById(id).then(data => setResource(data)).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="p-4">Loading resource...</div>;
  if (!resource) return <div className="p-4">Resource not found</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold">{resource.title}</h1>
      <p className="mt-2">{resource.content}</p>
      <div className="mt-4 text-sm text-muted">Tags: {(resource.tags || []).join(', ')}</div>
    </div>
  );
};

export default ResourceDetail;
