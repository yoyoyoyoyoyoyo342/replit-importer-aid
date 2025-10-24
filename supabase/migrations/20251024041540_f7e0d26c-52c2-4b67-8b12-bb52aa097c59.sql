-- Create saved_locations table for multi-location management
CREATE TABLE public.saved_locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  latitude NUMERIC NOT NULL,
  longitude NUMERIC NOT NULL,
  country TEXT,
  state TEXT,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.saved_locations ENABLE ROW LEVEL SECURITY;

-- Create policies for saved_locations
CREATE POLICY "Users can view their own locations" 
ON public.saved_locations 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own locations" 
ON public.saved_locations 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own locations" 
ON public.saved_locations 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own locations" 
ON public.saved_locations 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create weather_history table for trends
CREATE TABLE public.weather_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  location_name TEXT NOT NULL,
  latitude NUMERIC NOT NULL,
  longitude NUMERIC NOT NULL,
  date DATE NOT NULL,
  avg_temp NUMERIC NOT NULL,
  high_temp NUMERIC NOT NULL,
  low_temp NUMERIC NOT NULL,
  precipitation NUMERIC DEFAULT 0,
  condition TEXT,
  humidity NUMERIC,
  wind_speed NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, latitude, longitude, date)
);

-- Enable RLS
ALTER TABLE public.weather_history ENABLE ROW LEVEL SECURITY;

-- Create policies for weather_history
CREATE POLICY "Users can view their own weather history" 
ON public.weather_history 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own weather history" 
ON public.weather_history 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_weather_history_user_date ON public.weather_history(user_id, date DESC);
CREATE INDEX idx_saved_locations_user ON public.saved_locations(user_id);

-- Add trigger for updated_at on saved_locations
CREATE TRIGGER update_saved_locations_updated_at
BEFORE UPDATE ON public.saved_locations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();