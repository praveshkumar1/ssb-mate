import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '@/services/api';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

const BlogEditor = () => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Category suggestions (tap to fill) — similar UX to onboarding suggestions
  const categorySuggestions = useMemo(
    () => [
      'Psychology',
      'Group Tasks',
      'Interview',
      'SSB Tips',
      'OIR',
      'PPDT',
      'GTO',
      'Conference',
      'Screening',
      'WAT',
      'TAT',
      'SRT',
      'Strategy',
      'Success Stories',
    ],
    []
  );

  const submit = async () => {
    setSaving(true);
    try {
      const payload: any = {
        title: title.trim(),
        content: content.trim(),
        published: true,
      };
      if (category.trim()) payload.category = category.trim();
      if (excerpt.trim()) payload.excerpt = excerpt.trim();
      if (thumbnailUrl.trim()) payload.thumbnailUrl = thumbnailUrl.trim();

      const resp: any = await apiClient.post('/blog', payload);
      const post = resp?.data?.data || resp?.data || resp;
      toast({ title: 'Published', description: 'Your article is live.' });
      navigate(`/blog/${post.id}`);
    } catch (e: any) {
      toast({ title: 'Failed to publish', description: e?.message || 'Please try again', variant: 'destructive' });
    } finally { setSaving(false); }
  };

  return (
    <div className="container mx-auto px-4 py-10 max-w-4xl">
      <Card className="shadow-card">
        <CardHeader>
          <h1 className="text-2xl font-bold">Write Blog</h1>
          <p className="text-sm text-muted-foreground">Share your expertise with candidates. Title and content are required; category and thumbnail are optional.</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium mb-1">Title<span className="text-destructive">*</span></label>
              <Input id="title" placeholder="e.g. 10 Essential Tips for SSB Psychology Tests" value={title} onChange={e => setTitle(e.target.value)} />
              <div className="text-xs text-muted-foreground mt-1">At least 3 characters.</div>
            </div>

            {/* Category with suggestions */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium mb-1">Category</label>
              <Input id="category" placeholder="Pick or type a category (optional)" value={category} onChange={e => setCategory(e.target.value)} />
              {categorySuggestions.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {categorySuggestions.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCategory(c)}
                      className={`px-3 py-1 rounded text-sm border ${category === c ? 'bg-primary text-white border-primary' : 'bg-muted hover:bg-accent'} transition-colors`}
                      aria-pressed={category === c}
                    >
                      {c}
                    </button>
                  ))}
                  {category && (
                    <button type="button" onClick={() => setCategory('')} className="px-3 py-1 rounded text-sm border bg-muted hover:bg-accent transition-colors">
                      Clear
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Thumbnail */}
            <div>
              <label htmlFor="thumb" className="block text-sm font-medium mb-1">Thumbnail URL</label>
              <Input id="thumb" placeholder="https://... (optional)" value={thumbnailUrl} onChange={e => setThumbnailUrl(e.target.value)} />
              {thumbnailUrl && (
                <div className="mt-3">
                  <div className="text-xs text-muted-foreground mb-1">Preview</div>
                  <div className="w-full aspect-[16/9] overflow-hidden rounded border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={thumbnailUrl} alt="thumbnail preview" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0.3'; }} />
                  </div>
                </div>
              )}
            </div>

            {/* Excerpt */}
            <div>
              <label htmlFor="excerpt" className="block text-sm font-medium mb-1">Short excerpt</label>
              <textarea id="excerpt" className="w-full p-3 border rounded bg-background" placeholder="Max 500 characters (appears in previews)" maxLength={500} rows={4} value={excerpt} onChange={e => setExcerpt(e.target.value)} />
              <div className="text-xs text-muted-foreground mt-1">{excerpt.length}/500</div>
            </div>

            {/* Content */}
            <div>
              <label htmlFor="content" className="block text-sm font-medium mb-1">Content<span className="text-destructive">*</span></label>
              <textarea id="content" className="w-full p-3 border rounded bg-background min-h-[320px]" placeholder="Write your article here... You can paste text as well." value={content} onChange={e => setContent(e.target.value)} />
              <div className="text-xs text-muted-foreground mt-1">At least ~20 characters. Tip: Break long posts with headings and lists for readability.</div>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => navigate(-1)} disabled={saving}>Cancel</Button>
              <Button onClick={submit} disabled={saving || !title.trim() || !content.trim()}>{saving ? 'Publishing...' : 'Publish'}</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BlogEditor;
