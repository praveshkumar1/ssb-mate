import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '@/services/api';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, ArrowRight } from 'lucide-react';

interface BlogPost {
  id: string;
  title: string;
  excerpt?: string;
  content: string;
  category?: string;
  thumbnailUrl?: string;
  featured?: boolean;
  createdAt: string;
  authorId?: any;
}

const BlogList = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    apiClient.get('/blog').then((resp: any) => {
      const data = resp?.data ?? resp;
      if (mounted) setPosts(data?.data || data || []);
    }).finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, []);

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">All Articles</h1>
        <Link to="/dashboard/blog/new"><Button>Write Blog</Button></Link>
      </div>
      {loading ? (
        <div className="text-muted-foreground">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {posts.map((post) => (
            <Card key={post.id} className="shadow-card bg-card">
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="outline">{post.category || 'General'}</Badge>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    {new Date(post.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <h2 className="text-xl font-semibold">{post.title}</h2>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground line-clamp-3">{post.excerpt || post.content.slice(0, 140) + '...'}</p>
                <div className="mt-4 flex justify-end">
                  <Link to={`/blog/${post.id}`}><Button variant="ghost" size="sm"><ArrowRight className="h-4 w-4" /></Button></Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default BlogList;
