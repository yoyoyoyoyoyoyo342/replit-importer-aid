-- Restore streak data for all users

-- Seje_ged: current=33, longest=33
UPDATE public.user_streaks 
SET current_streak = 33, longest_streak = 33, total_visits = 33, last_visit_date = '2025-12-17'
WHERE user_id = '7ac7d2c8-684e-4122-90e8-742b1a0e427e';

-- gerda: current=1, longest=10
UPDATE public.user_streaks 
SET current_streak = 1, longest_streak = 10, total_visits = 10, last_visit_date = '2025-12-17'
WHERE user_id = '27bf4e82-1aad-4dee-b91c-e1dc06e079ec';

-- karenheltoft: current=8, longest=8
UPDATE public.user_streaks 
SET current_streak = 8, longest_streak = 8, total_visits = 8, last_visit_date = '2025-12-17'
WHERE user_id = 'c695b34c-3ed1-4ac2-8b7e-3e618b698893';

-- Adamhallo: current=1, longest=2
UPDATE public.user_streaks 
SET current_streak = 1, longest_streak = 2, total_visits = 2, last_visit_date = '2025-12-17'
WHERE user_id = '11d843bb-1ffa-4383-940d-117dd0f3270a';

-- All other users: current=1, longest=1
UPDATE public.user_streaks 
SET current_streak = 1, longest_streak = 1, total_visits = 1, last_visit_date = '2025-12-17'
WHERE user_id NOT IN (
  '7ac7d2c8-684e-4122-90e8-742b1a0e427e',
  '27bf4e82-1aad-4dee-b91c-e1dc06e079ec',
  'c695b34c-3ed1-4ac2-8b7e-3e618b698893',
  '11d843bb-1ffa-4383-940d-117dd0f3270a'
);