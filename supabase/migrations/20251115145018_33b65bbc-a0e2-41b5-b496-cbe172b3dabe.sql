-- Create weather_reports table to track user corrections
CREATE TABLE IF NOT EXISTS public.weather_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  location_name TEXT NOT NULL,
  latitude NUMERIC NOT NULL,
  longitude NUMERIC NOT NULL,
  report_date DATE NOT NULL DEFAULT CURRENT_DATE,
  reported_condition TEXT NOT NULL,
  actual_condition TEXT NOT NULL,
  accuracy TEXT NOT NULL,
  report_details TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE public.weather_reports ENABLE ROW LEVEL SECURITY;

-- Users can create their own reports
CREATE POLICY "Users can create their own reports"
ON public.weather_reports
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can view their own reports
CREATE POLICY "Users can view their own reports"
ON public.weather_reports
FOR SELECT
USING (auth.uid() = user_id);

-- Create index for efficient querying of corrections
CREATE INDEX idx_weather_reports_location_date ON public.weather_reports(location_name, report_date, actual_condition);

-- Create trigger for updated_at
CREATE TRIGGER update_weather_reports_updated_at
BEFORE UPDATE ON public.weather_reports
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();