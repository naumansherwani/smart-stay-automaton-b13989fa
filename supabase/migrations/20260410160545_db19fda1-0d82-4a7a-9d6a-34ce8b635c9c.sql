
-- Feature usage tracking table
CREATE TABLE public.feature_usage (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  feature_key text NOT NULL,
  usage_count integer NOT NULL DEFAULT 0,
  last_used_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, feature_key)
);

ALTER TABLE public.feature_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own usage" ON public.feature_usage
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own usage" ON public.feature_usage
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own usage" ON public.feature_usage
  FOR UPDATE USING (auth.uid() = user_id);

CREATE TRIGGER update_feature_usage_updated_at
  BEFORE UPDATE ON public.feature_usage
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert trial plan limits
INSERT INTO public.plan_feature_limits (plan, feature_key, limit_value, is_unlimited) VALUES
  ('trial', 'crm_contacts', 150, false),
  ('trial', 'bookings', -1, true),
  ('trial', 'ai_calendar', -1, true),
  ('trial', 'ai_pricing', 20, false),
  ('trial', 'ai_follow_ups', 10, false),
  ('trial', 'advanced_crm', 0, false),
  ('trial', 'voice_assistant', 0, false),
  ('trial', 'white_label', 0, false),
  ('trial', 'multi_team', 0, false);
