
SELECT cron.unschedule(5);

SELECT cron.schedule(
  'owner-schedule-dispatch-every-minute',
  '* * * * *',
  $$
  SELECT net.http_post(
    url := 'https://uapvdzphibxoomokahjh.supabase.co/functions/v1/owner-schedule-dispatch',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (
        SELECT decrypted_secret FROM vault.decrypted_secrets
        WHERE name = 'email_queue_service_role_key'
      )
    ),
    body := '{}'::jsonb
  );
  $$
);
