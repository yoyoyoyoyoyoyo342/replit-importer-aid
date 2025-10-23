-- Add is_24_hour column to user_preferences table
ALTER TABLE user_preferences 
ADD COLUMN IF NOT EXISTS is_24_hour BOOLEAN DEFAULT true;