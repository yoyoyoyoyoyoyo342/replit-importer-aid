-- Add DELETE and UPDATE policies for weather_history table to allow users to manage their data

CREATE POLICY "Users can delete their own weather history"
ON weather_history FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own weather history"
ON weather_history FOR UPDATE
USING (auth.uid() = user_id);