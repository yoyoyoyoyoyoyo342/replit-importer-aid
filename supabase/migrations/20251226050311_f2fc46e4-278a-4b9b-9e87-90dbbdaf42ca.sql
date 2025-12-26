-- Add scheduled_at column to blog_posts for scheduling posts
ALTER TABLE public.blog_posts ADD COLUMN scheduled_at timestamp with time zone DEFAULT NULL;

-- Create blog_images storage bucket for cover images
INSERT INTO storage.buckets (id, name, public) VALUES ('blog_images', 'blog_images', true);

-- Storage policies for blog_images
CREATE POLICY "Admins can upload blog images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'blog_images' AND has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update blog images" ON storage.objects FOR UPDATE USING (bucket_id = 'blog_images' AND has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete blog images" ON storage.objects FOR DELETE USING (bucket_id = 'blog_images' AND has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anyone can view blog images" ON storage.objects FOR SELECT USING (bucket_id = 'blog_images');