-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create a function that calls the verify-predictions edge function
CREATE OR REPLACE FUNCTION public.trigger_verify_predictions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  response json;
BEGIN
  -- Call the verify-predictions edge function
  SELECT content::json INTO response
  FROM http((
    'POST',
    current_setting('app.settings.supabase_url') || '/functions/v1/verify-predictions',
    ARRAY[http_header('Authorization', 'Bearer ' || current_setting('app.settings.supabase_anon_key'))],
    'application/json',
    '{}'
  )::http_request);
  
  -- Log the result
  RAISE NOTICE 'Verify predictions result: %', response;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error calling verify-predictions: %', SQLERRM;
END;
$$;

-- Schedule the verification to run daily at 00:30 UTC (gives time for day to fully complete)
SELECT cron.schedule(
  'verify-daily-predictions',
  '30 0 * * *',
  'SELECT public.trigger_verify_predictions();'
);

-- Also create a manual trigger function for testing
CREATE OR REPLACE FUNCTION public.manual_verify_predictions()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  response json;
BEGIN
  PERFORM public.trigger_verify_predictions();
  RETURN json_build_object('status', 'triggered', 'message', 'Verification process started');
END;
$$;