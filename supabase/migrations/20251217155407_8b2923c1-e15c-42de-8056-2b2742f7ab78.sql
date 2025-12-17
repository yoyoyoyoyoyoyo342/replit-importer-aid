-- Create user notifications table for personal notifications like battle challenges
CREATE TABLE public.user_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('battle_challenge', 'battle_accepted', 'battle_result', 'streak_milestone', 'general')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;

-- Users can only view their own notifications
CREATE POLICY "Users can view their own notifications"
ON public.user_notifications FOR SELECT
USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update their own notifications"
ON public.user_notifications FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own notifications
CREATE POLICY "Users can delete their own notifications"
ON public.user_notifications FOR DELETE
USING (auth.uid() = user_id);

-- Allow inserts from authenticated users (for battle challenges)
CREATE POLICY "Authenticated users can create notifications"
ON public.user_notifications FOR INSERT
WITH CHECK (true);

-- Create index for faster lookups
CREATE INDEX idx_user_notifications_user_id ON public.user_notifications(user_id);
CREATE INDEX idx_user_notifications_is_read ON public.user_notifications(is_read);

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_notifications;