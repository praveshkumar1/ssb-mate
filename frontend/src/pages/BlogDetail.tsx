import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { apiClient } from '@/services/api';

const BlogDetail = () => {
  const { id } = useParams();
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    apiClient.get(`/blog/${id}`).then((resp: any) => {
      const data = resp?.data ?? resp;
      if (mounted) setPost(data?.data || data || null);
    }).finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, [id]);

  if (loading) return <div className="container mx-auto px-4 py-10 text-muted-foreground">Loading...</div>;
  if (!post) return <div className="container mx-auto px-4 py-10">Post not found</div>;

  return (
    <div className="container mx-auto px-4 py-10 max-w-3xl">
      <h1 className="text-3xl font-bold mb-2">{post.title}</h1>
      <div className="text-sm text-muted-foreground mb-6">
        {post.category || 'General'} • {new Date(post.createdAt).toLocaleDateString()}
      </div>
      {post.thumbnailUrl ? (
        <img src={post.thumbnailUrl} alt={post.title} className="w-full rounded mb-6" />
      ) : null}
      <article className="prose prose-neutral max-w-none">
        {post.content}
      </article>
    </div>
  );
};

export default BlogDetail;
