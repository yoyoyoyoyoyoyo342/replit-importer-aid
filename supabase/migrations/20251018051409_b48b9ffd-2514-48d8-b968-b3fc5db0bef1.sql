-- Add language preference to user_preferences table
ALTER TABLE public.user_preferences 
ADD COLUMN IF NOT EXISTS language text DEFAULT 'en-GB';