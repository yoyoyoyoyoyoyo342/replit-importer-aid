-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the verify-predictions function to run daily at 1:00 AM UTC
-- This will verify yesterday's predictions and award points
SELECT cron.schedule(
  'verify-predictions-daily',
  '0 1 * * *', -- Run at 1:00 AM UTC every day
  $$
  SELECT net.http_post(
    url:='https://ohwtbkudpkfbakynikyj.supabase.co/functions/v1/verify-predictions',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9od3Ria3VkcGtmYmFreW5pa3lqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1NDQxOTMsImV4cCI6MjA3MDEyMDE5M30.ZjOP7yeDgqpFk_caDCF7rUpoE51DV8aqhxuLHDsjJrI"}'::jsonb
  ) as request_id;
  $$
);