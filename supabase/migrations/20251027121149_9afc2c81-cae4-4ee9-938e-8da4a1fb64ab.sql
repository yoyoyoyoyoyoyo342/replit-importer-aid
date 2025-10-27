-- Fix weather_history RLS policies to restrict to user's own data
DROP POLICY IF EXISTS "Anyone can view weather history for any location" ON weather_history;
DROP POLICY IF EXISTS "Anyone can insert weather history" ON weather_history;
DROP POLICY IF EXISTS "Anyone can update weather history for their location" ON weather_history;

-- Users can only view their own weather history
CREATE POLICY "Users view own weather history"
  ON weather_history FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only insert their own weather history
CREATE POLICY "Users insert own weather history"
  ON weather_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can only update their own weather history
CREATE POLICY "Users update own weather history"
  ON weather_history FOR UPDATE
  USING (auth.uid() = user_id);

-- Fix leaderboard view to use SECURITY INVOKER for consistency
CREATE OR REPLACE VIEW public.leaderboard
WITH (security_invoker = true)
AS
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
  'Public leaderboard showing top 10 users. Uses SECURITY INVOKER but data is intentionally public (users opt-in via display names).';

GRANT SELECT ON public.leaderboard TO authenticated;