-- Update user_streaks to track daily visits instead of predictions
ALTER TABLE public.user_streaks 
  RENAME COLUMN last_prediction_date TO last_visit_date;

-- Update the comment
COMMENT ON COLUMN public.user_streaks.last_visit_date IS 'Last date user opened the app';

-- The total_predictions column will stay to track actual predictions
COMMENT ON COLUMN public.user_streaks.total_predictions IS 'Total number of weather predictions made';

-- Add a new column to track total visits if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'user_streaks' 
                 AND column_name = 'total_visits') THEN
    ALTER TABLE public.user_streaks ADD COLUMN total_visits integer NOT NULL DEFAULT 1;
  END IF;
END $$;

COMMENT ON COLUMN public.user_streaks.total_visits IS 'Total number of days user has visited the app';