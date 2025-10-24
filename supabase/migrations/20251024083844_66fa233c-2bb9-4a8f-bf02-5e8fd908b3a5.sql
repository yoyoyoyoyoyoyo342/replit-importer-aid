-- Make user_id nullable for weather_history to support unauthenticated users
ALTER TABLE public.weather_history 
ALTER COLUMN user_id DROP NOT NULL;

-- Drop existing RLS policies
DROP POLICY IF EXISTS "Users can view their own weather history" ON public.weather_history;
DROP POLICY IF EXISTS "Users can insert their own weather history" ON public.weather_history;
DROP POLICY IF EXISTS "Users can update their own weather history" ON public.weather_history;
DROP POLICY IF EXISTS "Users can delete their own weather history" ON public.weather_history;

-- Create new RLS policies that work for both authenticated and unauthenticated users
CREATE POLICY "Anyone can view weather history for any location"
ON public.weather_history
FOR SELECT
USING (true);

CREATE POLICY "Anyone can insert weather history"
ON public.weather_history
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can update weather history for their location"
ON public.weather_history
FOR UPDATE
USING (true);

CREATE POLICY "Authenticated users can delete their own history"
ON public.weather_history
FOR DELETE
USING (auth.uid() = user_id OR user_id IS NULL);