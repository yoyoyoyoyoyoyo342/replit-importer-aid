-- Add address and coordinates fields to user_preferences table
ALTER TABLE user_preferences 
ADD COLUMN IF NOT EXISTS saved_address TEXT,
ADD COLUMN IF NOT EXISTS saved_latitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS saved_longitude DOUBLE PRECISION;