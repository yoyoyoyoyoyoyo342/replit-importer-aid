import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useIsAdmin } from '@/hooks/use-is-admin';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Plus, Edit, Trash2, Eye, EyeOff, Upload, X, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/use-auth';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  cover_image_url: string | null;
  is_published: boolean;
  published_at: string | null;
  scheduled_at: string | null;
  created_at: string;
  updated_at: string;
}

export default function Blog() {
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    cover_image_url: '',
    is_published: false,
    scheduled_at: ''
  });

  useEffect(() => {
    if (isAdmin) {
      loadPosts();
    }
  }, [isAdmin]);

  const loadPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts((data || []) as BlogPost[]);
    } catch (error) {
      toast.error('Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleTitleChange = (title: string) => {
    setFormData(prev => ({
      ...prev,
      title,
      slug: editingPost ? prev.slug : generateSlug(title)
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('blog_images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('blog_images')
        .getPublicUrl(fileName);

      setFormData(prev => ({ ...prev, cover_image_url: publicUrl }));
      toast.success('Image uploaded successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const notifyAllUsers = async (post: { title: string; excerpt: string | null; slug: string }) => {
    try {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id');

      if (!profiles || profiles.length === 0) return;

      const notifications = profiles.map(profile => ({
        user_id: profile.user_id,
        type: 'article',
        title: `New Article: ${post.title}`,
        message: `${post.excerpt || post.title}\n\nRead the full article at https://rainz.net/blog/${post.slug}`,
        metadata: { slug: post.slug }
      }));

      await supabase.from('user_notifications').insert(notifications);
    } catch (error) {
      console.error('Failed to notify users:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.content) {
      toast.error('Title and content are required');
      return;
    }

    try {
      const shouldPublishNow = formData.is_published && !formData.scheduled_at;
      const scheduledDate = formData.scheduled_at ? new Date(formData.scheduled_at).toISOString() : null;

      const postData = {
        title: formData.title,
        slug: formData.slug || generateSlug(formData.title),
        content: formData.content,
        excerpt: formData.excerpt || null,
        cover_image_url: formData.cover_image_url || null,
        is_published: shouldPublishNow,
        published_at: shouldPublishNow ? new Date().toISOString() : null,
        scheduled_at: scheduledDate,
        author_id: user?.id
      };

      if (editingPost) {
        const { error } = await supabase
          .from('blog_posts')
          .update(postData)
          .eq('id', editingPost.id);

        if (error) throw error;
        
        if (shouldPublishNow && !editingPost.is_published) {
          await notifyAllUsers({ title: formData.title, excerpt: formData.excerpt, slug: postData.slug });
        }
        
        toast.success('Post updated successfully');
      } else {
        const { error } = await supabase
          .from('blog_posts')
          .insert(postData);

        if (error) throw error;
        
        if (shouldPublishNow) {
          await notifyAllUsers({ title: formData.title, excerpt: formData.excerpt, slug: postData.slug });
        }
        
        toast.success('Post created successfully');
      }

      resetForm();
      loadPosts();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save post');
    }
  };

  const handleEdit = (post: BlogPost) => {
    setEditingPost(post);
    setFormData({
      title: post.title,
      slug: post.slug,
      content: post.content,
      excerpt: post.excerpt || '',
      cover_image_url: post.cover_image_url || '',
      is_published: post.is_published,
      scheduled_at: post.scheduled_at ? new Date(post.scheduled_at).toISOString().slice(0, 16) : ''
    });
    setIsCreating(true);
  };

  const handleDelete = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      const { error } = await supabase
        .from('blog_posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;
      toast.success('Post deleted successfully');
      loadPosts();
    } catch (error) {
      toast.error('Failed to delete post');
    }
  };

  const togglePublish = async (post: BlogPost) => {
    try {
      const newPublishedState = !post.is_published;
      const { error } = await supabase
        .from('blog_posts')
        .update({
          is_published: newPublishedState,
          published_at: newPublishedState ? new Date().toISOString() : null
        })
        .eq('id', post.id);

      if (error) throw error;
      
      if (newPublishedState) {
        await notifyAllUsers({ title: post.title, excerpt: post.excerpt, slug: post.slug });
      }
      
      toast.success(post.is_published ? 'Post unpublished' : 'Post published');
      loadPosts();
    } catch (error) {
      toast.error('Failed to update post');
    }
  };

  const resetForm = () => {
    setEditingPost(null);
    setIsCreating(false);
    setFormData({
      title: '',
      slug: '',
      content: '',
      excerpt: '',
      cover_image_url: '',
      is_published: false,
      scheduled_at: ''
    });
  };

  if (adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-foreground">Loading...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4 text-foreground">Access Denied</h1>
          <p className="text-muted-foreground mb-4">You don't have permission to access this page.</p>
          <Button onClick={() => navigate('/')}>Go Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4 max-w-6xl">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <h1 className="text-3xl font-bold text-foreground">Blog Management</h1>
          </div>
          {!isCreating && (
            <Button onClick={() => setIsCreating(true)}>
              <Plus className="w-4 h-4 mr-2" />
              New Post
            </Button>
          )}
        </div>

        {isCreating ? (
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-card-foreground">
                {editingPost ? 'Edit Post' : 'Create New Post'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder="Enter post title"
                    className="bg-background"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slug">Slug</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                    placeholder="post-url-slug"
                    className="bg-background"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="excerpt">Excerpt</Label>
                  <Textarea
                    id="excerpt"
                    value={formData.excerpt}
                    onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
                    placeholder="Brief description of the post"
                    rows={2}
                    className="bg-background"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Cover Image</Label>
                  <div className="flex gap-2">
                    <Input
                      value={formData.cover_image_url}
                      onChange={(e) => setFormData(prev => ({ ...prev, cover_image_url: e.target.value }))}
                      placeholder="Image URL or upload below"
                      className="bg-background flex-1"
                    />
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                    >
                      {uploading ? 'Uploading...' : <Upload className="w-4 h-4" />}
                    </Button>
                    {formData.cover_image_url && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setFormData(prev => ({ ...prev, cover_image_url: '' }))}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  {formData.cover_image_url && (
                    <img
                      src={formData.cover_image_url}
                      alt="Cover preview"
                      className="mt-2 max-h-40 rounded-lg object-cover"
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content">Content (Markdown supported)</Label>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Write your blog post content here..."
                    rows={15}
                    className="bg-background font-mono text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_published"
                      checked={formData.is_published}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_published: checked }))}
                    />
                    <Label htmlFor="is_published">Publish immediately</Label>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="scheduled_at" className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Schedule for later
                    </Label>
                    <Input
                      id="scheduled_at"
                      type="datetime-local"
                      value={formData.scheduled_at}
                      onChange={(e) => setFormData(prev => ({ ...prev, scheduled_at: e.target.value, is_published: false }))}
                      className="bg-background"
                      disabled={formData.is_published}
                    />
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button type="submit">
                    {editingPost ? 'Update Post' : 'Create Post'}
                  </Button>
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading posts...</div>
            ) : posts.length === 0 ? (
              <Card className="bg-card border-border">
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground mb-4">No blog posts yet</p>
                  <Button onClick={() => setIsCreating(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create your first post
                  </Button>
                </CardContent>
              </Card>
            ) : (
              posts.map((post) => (
                <Card key={post.id} className="bg-card border-border">
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="text-lg font-semibold text-card-foreground">{post.title}</h3>
                          {post.is_published ? (
                            <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded">
                              Published
                            </span>
                          ) : post.scheduled_at ? (
                            <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded">
                              Scheduled: {new Date(post.scheduled_at).toLocaleDateString()}
                            </span>
                          ) : (
                            <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded">
                              Draft
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          /{post.slug}
                        </p>
                        {post.excerpt && (
                          <p className="text-sm text-muted-foreground line-clamp-2">{post.excerpt}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">
                          Created: {new Date(post.created_at).toLocaleDateString()}
                          {post.published_at && ` • Published: ${new Date(post.published_at).toLocaleDateString()}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => togglePublish(post)}
                          title={post.is_published ? 'Unpublish' : 'Publish'}
                        >
                          {post.is_published ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(post)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(post.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
