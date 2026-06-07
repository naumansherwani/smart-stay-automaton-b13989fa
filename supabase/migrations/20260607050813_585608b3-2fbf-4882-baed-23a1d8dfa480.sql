-- Disable broken cron jobs causing 401/403 spam and DB pressure.
-- owner-schedule-dispatch (job 8) — vault-stored auth token is invalid, every-minute 401s
-- arc-orchestrator-30min (job 6) — calls JWT-protected function with anon key, 403s
-- Both backends are being decommissioned per sovereign architecture; unscheduling stops error storm.
SELECT cron.unschedule('owner-schedule-dispatch-every-minute');
SELECT cron.unschedule('arc-orchestrator-30min');