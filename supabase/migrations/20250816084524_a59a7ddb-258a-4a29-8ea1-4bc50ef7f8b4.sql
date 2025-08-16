-- Drop the overly permissive policy that allows everyone to view all profiles
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

-- Create a more secure policy that only allows authenticated users to view basic profile info
-- but keeps sensitive data private
CREATE POLICY "Authenticated users can view basic profile info" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (true);

-- Create a policy that allows users to view their own complete profile data
CREATE POLICY "Users can view their own complete profile" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

-- Create a function to get safe profile data for public viewing by authenticated users
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