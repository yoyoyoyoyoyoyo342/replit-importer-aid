-- Allow authenticated users to view all user streaks for leaderboard
CREATE POLICY "All users can view streaks for leaderboard"
ON user_streaks
FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users to view all weather predictions for leaderboard stats
CREATE POLICY "All users can view prediction stats for leaderboard"
ON weather_predictions
FOR SELECT
TO authenticated
USING (true);