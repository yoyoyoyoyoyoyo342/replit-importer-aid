-- Delete existing cron job
SELECT cron.unschedule('verify-daily-predictions');

-- Create new cron job with proper service role key
SELECT cron.schedule(
  'verify-daily-predictions',
  '0 2 * * *',
  $$
  SELECT
    net.http_post(
        url:='https://ohwtbkudpkfbakynikyj.supabase.co/functions/v1/verify-predictions',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9od3Ria3VkcGtmYmFreW5pa3lqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDU0NDE5MywiZXhwIjoyMDcwMTIwMTkzfQ.y2y46sNsXKq-KEWsqf4kT5aHG3-ixEqyaPR4fh0okTw"}'::jsonb,
        body:='{}'::jsonb
    ) as request_id;
  $$
);