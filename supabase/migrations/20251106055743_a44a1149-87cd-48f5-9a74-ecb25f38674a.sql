-- Add is_high_contrast column to user_preferences table
ALTER TABLE user_preferences 
ADD COLUMN IF NOT EXISTS is_high_contrast BOOLEAN DEFAULT false;