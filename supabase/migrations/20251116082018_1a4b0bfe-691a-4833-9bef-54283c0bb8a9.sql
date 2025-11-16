-- Create broadcast_messages table for admin announcements
CREATE TABLE IF NOT EXISTS public.broadcast_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  is_active BOOLEAN DEFAULT true
);

-- Enable RLS
ALTER TABLE public.broadcast_messages ENABLE ROW LEVEL SECURITY;

-- Policy: Only admins can insert broadcast messages
CREATE POLICY "Admins can insert broadcast messages"
ON public.broadcast_messages
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Policy: Everyone can view active broadcast messages
CREATE POLICY "Anyone can view active broadcast messages"
ON public.broadcast_messages
FOR SELECT
USING (is_active = true);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.broadcast_messages;