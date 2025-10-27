-- Create weather predictions table
CREATE TABLE public.weather_predictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prediction_date date NOT NULL,
  predicted_high numeric NOT NULL,
  predicted_low numeric NOT NULL,
  predicted_condition text NOT NULL,
  actual_high numeric,
  actual_low numeric,
  actual_condition text,
  is_verified boolean DEFAULT false,
  is_correct boolean,
  points_earned integer DEFAULT 0,
  location_name text NOT NULL,
  latitude numeric NOT NULL,
  longitude numeric NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, prediction_date, location_name)
);

-- Enable RLS
ALTER TABLE public.weather_predictions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for weather_predictions
CREATE POLICY "Users can view their own predictions"
  ON public.weather_predictions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own predictions"
  ON public.weather_predictions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own predictions"
  ON public.weather_predictions FOR UPDATE
  USING (auth.uid() = user_id);

-- Add points column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS total_points integer DEFAULT 0;

-- Update user_streaks to be prediction-based
ALTER TABLE public.user_streaks 
  RENAME COLUMN last_visit_date TO last_prediction_date;

ALTER TABLE public.user_streaks
  RENAME COLUMN total_visits TO total_predictions;

-- Create leaderboard view for top 10
CREATE OR REPLACE VIEW public.leaderboard AS
SELECT 
  p.id,
  p.display_name,
  p.total_points,
  us.current_streak,
  us.longest_streak,
  COUNT(wp.id) as total_predictions,
  COUNT(CASE WHEN wp.is_correct = true THEN 1 END) as correct_predictions
FROM public.profiles p
LEFT JOIN public.user_streaks us ON p.user_id = us.user_id
LEFT JOIN public.weather_predictions wp ON p.user_id = wp.user_id
WHERE p.display_name IS NOT NULL AND p.total_points > 0
GROUP BY p.id, p.display_name, p.total_points, us.current_streak, us.longest_streak
ORDER BY p.total_points DESC
LIMIT 10;

-- Grant access to leaderboard view
GRANT SELECT ON public.leaderboard TO authenticated;

-- Add trigger to update points
CREATE OR REPLACE FUNCTION public.update_prediction_points()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_verified = true AND OLD.is_verified = false THEN
    -- Update total points in profiles
    UPDATE public.profiles
    SET total_points = total_points + NEW.points_earned
    WHERE user_id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_update_prediction_points
  AFTER UPDATE ON public.weather_predictions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_prediction_points();