import { useEffect, useState } from "react";
import { Link } from 'react-router-dom';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Clock, ArrowRight, BookOpen } from "lucide-react";
import { apiClient } from '@/services/api';

type Post = { id: string; title: string; excerpt?: string; content: string; category?: string; createdAt: string; authorId?: any; thumbnailUrl?: string; featured?: boolean };

const BlogSection = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    apiClient.get('/blog').then((resp: any) => {
      const data = resp?.data ?? resp;
      if (mounted) setPosts((data?.data || data || []).slice(0, 5));
    }).finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, []);

  return (
    <section id="blog" className="py-20 bg-background scroll-mt-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4">
            <BookOpen className="h-4 w-4 mr-2" />
            SSB Preparation Blog
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Expert <span className="gradient-primary bg-clip-text text-transparent">Insights</span> & Tips
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Stay updated with the latest SSB preparation strategies, success stories, 
            and expert advice from our experienced coaches and mentors.
          </p>
        </div>

        {/* Featured Post */}
        {posts.filter(post => post.featured).map((post) => (
          <Card key={post.id} className="mb-12 shadow-elegant bg-card overflow-hidden">
            <div className="md:flex">
              <div className="md:w-1/3 bg-gradient-hero"></div>
              <div className="md:w-2/3 p-8">
                <div className="flex items-center gap-4 mb-4">
                  <Badge variant="secondary">{post.category || 'General'}</Badge>
                  <Badge className="gradient-primary text-white">Featured</Badge>
                </div>
                
                <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                  {post.title}
                </h3>
                
                <p className="text-muted-foreground mb-6 text-lg">
                  {post.excerpt || post.content.slice(0, 160) + '...'}
                </p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={post.authorId?.profileImageUrl || ''} alt={`${post.authorId?.firstName || ''} ${post.authorId?.lastName || ''}`} />
                      <AvatarFallback>
                        {`${(post.authorId?.firstName?.[0] || 'S')}${(post.authorId?.lastName?.[0] || 'M')}`}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-foreground">{post.authorId ? `${post.authorId.firstName || ''} ${post.authorId.lastName || ''}`.trim() || 'Unknown Author' : 'SSB Mate Team'}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        {new Date(post.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <Link to={`/blog/${post.id}`}>
                    <Button variant="premium">
                      Read More
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </Card>
        ))}

        {/* Regular Posts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {posts.filter(post => !post.featured).map((post) => (
            <Card key={post.id} className="shadow-card hover:shadow-elegant transition-smooth bg-card">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between mb-4">
                  <Badge variant="outline">{post.category || 'General'}</Badge>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    {new Date(post.createdAt).toLocaleDateString()}
                  </div>
                </div>
                
                <h3 className="text-xl font-semibold text-foreground mb-3 line-clamp-2">
                  {post.title}
                </h3>
                
                <p className="text-muted-foreground line-clamp-3">
                  {post.excerpt || post.content.slice(0, 160) + '...'}
                </p>
              </CardHeader>
              
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={post.authorId?.profileImageUrl || ''} alt={`${post.authorId?.firstName || ''} ${post.authorId?.lastName || ''}`} />
                      <AvatarFallback className="text-sm">
                        {`${(post.authorId?.firstName?.[0] || 'S')}${(post.authorId?.lastName?.[0] || 'M')}`}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium text-foreground">{post.authorId ? `${post.authorId.firstName || ''} ${post.authorId.lastName || ''}`.trim() || 'Unknown Author' : 'SSB Mate Team'}</p>
                      <p className="text-xs text-muted-foreground">{new Date(post.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <Link to={`/blog/${post.id}`}>
                    <Button variant="ghost" size="sm">
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* View All Button */}
        <div className="text-center">
          <Link to="/blog">
            <Button variant="trust" size="lg">
              <BookOpen className="h-4 w-4 mr-2" />
              View All Articles
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default BlogSection;