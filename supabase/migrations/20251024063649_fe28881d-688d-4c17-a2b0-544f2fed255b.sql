-- Fix Security Definer View issue by explicitly setting SECURITY INVOKER
-- Drop the existing view
DROP VIEW IF EXISTS public.public_games;

-- Recreate the view with SECURITY INVOKER to ensure RLS policies are properly enforced
CREATE OR REPLACE VIEW public.public_games
WITH (security_invoker = true)
AS
SELECT 
  id,
  user_id,
  title,
  description,
  thumbnail_url,
  is_public,
  play_count,
  created_at,
  updated_at
FROM public.games
WHERE is_public = true;

-- Grant access to the view
GRANT SELECT ON public.public_games TO authenticated, anon;

-- Update comment to reflect security invoker setting
COMMENT ON VIEW public.public_games IS 'Public view of games (SECURITY INVOKER) that excludes sensitive code column. RLS policies from games table are enforced based on querying user.';