-- Add RLS policy to allow authenticated users to view basic profile info for leaderboard and user search
CREATE POLICY "Authenticated users can view display names for leaderboard" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (true);