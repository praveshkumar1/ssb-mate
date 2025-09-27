import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Clock, User, ArrowRight, BookOpen } from "lucide-react";

const BlogSection = () => {
  const blogPosts = [
    {
      id: 1,
      title: "10 Essential Tips for SSB Psychology Tests",
      excerpt: "Master the psychological assessment with these proven strategies from former SSB officers. Learn how to approach TAT, WAT, and SRT effectively.",
      author: "Col. Rajesh Kumar",
  authorAvatar: "/avatars/soldier_male.png",
      readTime: "8 min read",
      publishDate: "Dec 15, 2023",
      category: "Psychology",
      featured: true
    },
    {
      id: 2,
      title: "Common Mistakes in Group Discussion Round",
      excerpt: "Avoid these critical errors that most candidates make during GD. Expert insights on how to stand out positively in group activities.",
      author: "Maj. Priya Singh", 
  authorAvatar: "/avatars/soldier_male.png",
      readTime: "6 min read",
      publishDate: "Dec 12, 2023",
      category: "Group Tasks"
    },
    {
      id: 3,
      title: "Personal Interview: What SSB Officers Really Look For",
      excerpt: "Understand the mindset of SSB interviewers and learn how to present yourself authentically while showcasing leadership qualities.",
      author: "Lt. Col. Amit Sharma",
  authorAvatar: "/avatars/soldier_male.png", 
      readTime: "10 min read",
      publishDate: "Dec 10, 2023",
      category: "Interview"
    }
  ];

  return (
    <section id="blog" className="py-20 bg-background">
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
        {blogPosts.filter(post => post.featured).map((post) => (
          <Card key={post.id} className="mb-12 shadow-elegant bg-card overflow-hidden">
            <div className="md:flex">
              <div className="md:w-1/3 bg-gradient-hero"></div>
              <div className="md:w-2/3 p-8">
                <div className="flex items-center gap-4 mb-4">
                  <Badge variant="secondary">{post.category}</Badge>
                  <Badge className="gradient-primary text-white">Featured</Badge>
                </div>
                
                <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                  {post.title}
                </h3>
                
                <p className="text-muted-foreground mb-6 text-lg">
                  {post.excerpt}
                </p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={post.authorAvatar} alt={post.author} />
                      <AvatarFallback>
                        {post.author.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-foreground">{post.author}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{post.publishDate}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {post.readTime}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button variant="premium">
                    Read More
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}

        {/* Regular Posts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {blogPosts.filter(post => !post.featured).map((post) => (
            <Card key={post.id} className="shadow-card hover:shadow-elegant transition-smooth bg-card">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between mb-4">
                  <Badge variant="outline">{post.category}</Badge>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    {post.readTime}
                  </div>
                </div>
                
                <h3 className="text-xl font-semibold text-foreground mb-3 line-clamp-2">
                  {post.title}
                </h3>
                
                <p className="text-muted-foreground line-clamp-3">
                  {post.excerpt}
                </p>
              </CardHeader>
              
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={post.authorAvatar} alt={post.author} />
                      <AvatarFallback className="text-sm">
                        {post.author.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium text-foreground">{post.author}</p>
                      <p className="text-xs text-muted-foreground">{post.publishDate}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* View All Button */}
        <div className="text-center">
          <Button variant="trust" size="lg">
            <BookOpen className="h-4 w-4 mr-2" />
            View All Articles
          </Button>
        </div>
      </div>
    </section>
  );
};

export default BlogSection;