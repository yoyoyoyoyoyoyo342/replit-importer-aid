-- Add notification preferences columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS notify_severe_weather BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS notify_pollen BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS notify_daily_summary BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS notify_ai_preview BOOLEAN DEFAULT true;