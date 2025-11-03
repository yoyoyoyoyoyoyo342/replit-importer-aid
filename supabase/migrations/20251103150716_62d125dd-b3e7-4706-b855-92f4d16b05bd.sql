-- Add policy to allow authenticated users to view public profile info for leaderboard
CREATE POLICY "Public profile info viewable by authenticated users"
ON profiles
FOR SELECT
TO authenticated
USING (true);