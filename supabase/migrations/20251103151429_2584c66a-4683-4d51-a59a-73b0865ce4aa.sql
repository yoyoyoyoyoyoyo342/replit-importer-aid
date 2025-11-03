-- Update the cron job to use the service role key for authentication
SELECT cron.unschedule(1);

SELECT cron.schedule(
  'verify-daily-predictions',
  '0 2 * * *',
  $$
  SELECT
    net.http_post(
        url:='https://ohwtbkudpkfbakynikyj.supabase.co/functions/v1/verify-predictions',
        headers:=jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
        )
    ) as request_id;
  $$
);