-- Reset all user points to 0 for a fresh start
UPDATE public.profiles SET total_points = 0;

-- Also reset user streaks for a complete fresh start
UPDATE public.user_streaks SET 
  current_streak = 0,
  longest_streak = 0,
  total_visits = 0;