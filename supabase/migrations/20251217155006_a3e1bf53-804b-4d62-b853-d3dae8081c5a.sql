-- Create prediction battles table for head-to-head challenges
CREATE TABLE public.prediction_battles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  challenger_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  opponent_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  challenger_prediction_id UUID REFERENCES public.weather_predictions(id) ON DELETE SET NULL,
  opponent_prediction_id UUID REFERENCES public.weather_predictions(id) ON DELETE SET NULL,
  location_name TEXT NOT NULL,
  latitude NUMERIC NOT NULL,
  longitude NUMERIC NOT NULL,
  battle_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'completed', 'expired')),
  winner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  challenger_score INTEGER,
  opponent_score INTEGER,
  bonus_points INTEGER DEFAULT 50,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.prediction_battles ENABLE ROW LEVEL SECURITY;

-- Users can view battles they're part of
CREATE POLICY "Users can view their own battles"
ON public.prediction_battles FOR SELECT
USING (auth.uid() = challenger_id OR auth.uid() = opponent_id);

-- Users can create battles (as challenger)
CREATE POLICY "Users can create battles"
ON public.prediction_battles FOR INSERT
WITH CHECK (auth.uid() = challenger_id);

-- Users can update battles they're part of
CREATE POLICY "Users can update their battles"
ON public.prediction_battles FOR UPDATE
USING (auth.uid() = challenger_id OR auth.uid() = opponent_id);

-- Create index for faster lookups
CREATE INDEX idx_prediction_battles_challenger ON public.prediction_battles(challenger_id);
CREATE INDEX idx_prediction_battles_opponent ON public.prediction_battles(opponent_id);
CREATE INDEX idx_prediction_battles_status ON public.prediction_battles(status);

-- Add trigger for updated_at
CREATE TRIGGER update_prediction_battles_updated_at
BEFORE UPDATE ON public.prediction_battles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();