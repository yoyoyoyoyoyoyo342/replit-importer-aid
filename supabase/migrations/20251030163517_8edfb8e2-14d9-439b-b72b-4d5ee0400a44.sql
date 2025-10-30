-- Fix the leaderboard view to use SECURITY INVOKER to respect RLS
DROP VIEW IF EXISTS leaderboard;

CREATE VIEW leaderboard 
WITH (security_invoker = true)
AS
SELECT 
  ROW_NUMBER() OVER (ORDER BY p.total_points DESC, us.current_streak DESC) as rank,
  prof.display_name,
  p.total_points,
  us.current_streak,
  us.longest_streak,
  us.total_predictions,
  COALESCE(
    (SELECT COUNT(*) 
     FROM weather_predictions wp 
     WHERE wp.user_id = p.user_id 
     AND wp.is_verified = true 
     AND wp.is_correct = true), 
    0
  ) as correct_predictions
FROM profiles p
LEFT JOIN user_streaks us ON us.user_id = p.user_id
LEFT JOIN profiles prof ON prof.user_id = p.user_id
WHERE prof.display_name IS NOT NULL
ORDER BY p.total_points DESC, us.current_streak DESC
LIMIT 10;