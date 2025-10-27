-- Fix leaderboard view security issues
-- 1. Remove user ID exposure
-- 2. Add documentation about RLS not being needed
-- 3. Add database constraints for temperature validation

-- Drop and recreate leaderboard view without exposing user IDs
DROP VIEW IF EXISTS public.leaderboard;

CREATE OR REPLACE VIEW public.leaderboard AS
SELECT 
  ROW_NUMBER() OVER (ORDER BY p.total_points DESC) as rank,
  p.display_name,
  p.total_points,
  us.current_streak,
  us.longest_streak,
  COUNT(wp.id) as total_predictions,
  COUNT(CASE WHEN wp.is_correct = true THEN 1 END) as correct_predictions
FROM public.profiles p
LEFT JOIN public.user_streaks us ON p.user_id = us.user_id
LEFT JOIN public.weather_predictions wp ON p.user_id = wp.user_id
WHERE p.display_name IS NOT NULL
GROUP BY p.id, p.display_name, p.total_points, us.current_streak, us.longest_streak
ORDER BY p.total_points DESC
LIMIT 10;

COMMENT ON VIEW public.leaderboard IS 
  'Public leaderboard showing top 10 users. RLS not required as data is intentionally public and read-only. User IDs removed for privacy.';

-- Grant access to authenticated users
GRANT SELECT ON public.leaderboard TO authenticated;

-- Add temperature validation constraints to weather_predictions
ALTER TABLE public.weather_predictions
  DROP CONSTRAINT IF EXISTS reasonable_predicted_temps;

ALTER TABLE public.weather_predictions
  ADD CONSTRAINT reasonable_predicted_temps 
  CHECK (
    predicted_high >= -100 AND predicted_high <= 150
    AND predicted_low >= -100 AND predicted_low <= 150
    AND predicted_high >= predicted_low
  );

-- Add display name validation constraints to profiles
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS valid_display_name;

ALTER TABLE public.profiles
  ADD CONSTRAINT valid_display_name 
  CHECK (
    display_name IS NULL OR (
      LENGTH(TRIM(display_name)) >= 3 
      AND LENGTH(display_name) <= 20
      AND display_name ~ '^[a-zA-Z0-9_\- ]+$'
    )
  );