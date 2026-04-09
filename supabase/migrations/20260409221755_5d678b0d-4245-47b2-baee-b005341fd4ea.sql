
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

SELECT cron.schedule(
  'monthly-translation-update',
  '0 3 1 * *',
  $$
  SELECT net.http_post(
    url := 'https://uapvdzphibxoomokahjh.supabase.co/functions/v1/update-translations',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhcHZkenBoaWJ4b29tb2thaGpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NzA0NTUsImV4cCI6MjA5MTI0NjQ1NX0.ml7clpehMRZhYDReQfLsd0Q4HtDuj_FWgTB7LtuIlBc"}'::jsonb,
    body := '{"force": true}'::jsonb
  ) AS request_id;
  $$
);
