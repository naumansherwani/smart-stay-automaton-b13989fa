-- 1. Remove broken duplicate trial row
DELETE FROM public.plan_feature_limits
WHERE plan = 'trial' AND feature_key = 'ai_followups';

-- 2. Unlock previously-locked Pro AI features
UPDATE public.plan_feature_limits
SET is_unlimited = true, limit_value = 0
WHERE plan = 'pro'
  AND feature_key IN ('ai_voice_assistant', 'ai_conflict_resolution', 'ai_demand_forecasting');

-- 3. Add daily AI message limits per plan
INSERT INTO public.plan_feature_limits (plan, feature_key, limit_value, is_unlimited)
VALUES
  ('trial',   'ai_daily_messages', 5,  false),
  ('basic',   'ai_daily_messages', 0,  true),
  ('pro',     'ai_daily_messages', 0,  true),
  ('premium', 'ai_daily_messages', 0,  true),
  ('standard','ai_daily_messages', 0,  true)
ON CONFLICT (plan, feature_key) DO UPDATE
  SET limit_value = EXCLUDED.limit_value, is_unlimited = EXCLUDED.is_unlimited;

-- 4. Add hidden hourly fair-use ceilings (anti-spam, not shown to users)
INSERT INTO public.plan_feature_limits (plan, feature_key, limit_value, is_unlimited)
VALUES
  ('trial',   'ai_hourly_fairuse', 5,   false),
  ('basic',   'ai_hourly_fairuse', 60,  false),
  ('pro',     'ai_hourly_fairuse', 120, false),
  ('premium', 'ai_hourly_fairuse', 240, false),
  ('standard','ai_hourly_fairuse', 120, false)
ON CONFLICT (plan, feature_key) DO UPDATE
  SET limit_value = EXCLUDED.limit_value, is_unlimited = EXCLUDED.is_unlimited;

-- 5. Create AI message log table
CREATE TABLE IF NOT EXISTS public.ai_message_log (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL,
  function_name text NOT NULL,
  plan         text,
  model_used   text,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_msg_log_user_day
  ON public.ai_message_log (user_id, created_at DESC);

ALTER TABLE public.ai_message_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own AI log"
  ON public.ai_message_log
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all AI log"
  ON public.ai_message_log
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- service role inserts only; no INSERT policy needed for clients