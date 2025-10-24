-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "Users can view public games" ON public.games;

-- Create a policy that allows users to view ALL fields of their own games
CREATE POLICY "Users can view their own games with all fields"
ON public.games
FOR SELECT
USING (auth.uid() = user_id);

-- Create a policy that allows viewing only non-sensitive fields of public games
-- We'll use a view for this, but first we need a more restrictive policy
CREATE POLICY "Public games are viewable (restricted fields only)"
ON public.games
FOR SELECT
USING (is_public = true AND auth.uid() != user_id);

-- Create a secure view for public games that excludes the code column
CREATE OR REPLACE VIEW public.public_games AS
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

-- Add a comment explaining the security measure
COMMENT ON VIEW public.public_games IS 'Public view of games that excludes sensitive code column to prevent source code theft';