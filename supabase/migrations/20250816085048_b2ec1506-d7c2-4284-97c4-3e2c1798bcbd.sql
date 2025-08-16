-- Fix the function search path security issue
CREATE OR REPLACE FUNCTION public.get_public_profile(profile_user_id uuid)
RETURNS TABLE (
  id uuid,
  username text,
  display_name text,
  avatar_url text,
  bio text,
  created_at timestamptz
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE sql
AS $$
  SELECT 
    p.id,
    p.username,
    p.display_name,
    p.avatar_url,
    p.bio,
    p.created_at
  FROM public.profiles p
  WHERE p.user_id = profile_user_id;
$$;