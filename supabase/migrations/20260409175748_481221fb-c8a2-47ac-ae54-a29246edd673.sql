
-- Add plan feature limits table
CREATE TABLE public.plan_feature_limits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan public.subscription_plan NOT NULL,
  feature_key TEXT NOT NULL,
  limit_value INTEGER NOT NULL DEFAULT -1,
  is_unlimited BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(plan, feature_key)
);

-- Enable RLS
ALTER TABLE public.plan_feature_limits ENABLE ROW LEVEL SECURITY;

-- Everyone can read plan limits (public info)
CREATE POLICY "Anyone can view plan limits"
ON public.plan_feature_limits
FOR SELECT
TO authenticated
USING (true);

-- Insert Basic plan limits
INSERT INTO public.plan_feature_limits (plan, feature_key, limit_value, is_unlimited) VALUES
  ('basic', 'resources', 3, false),
  ('basic', 'bookings_per_month', 30, false),
  ('basic', 'ai_calendar', 10, false),
  ('basic', 'ai_pricing', 10, false),
  ('basic', 'industries', 1, false),
  ('basic', 'double_booking_guard', -1, true),
  ('basic', 'calendar_sync', -1, true),
  ('basic', 'email_notifications', -1, true),
  ('basic', 'basic_analytics', -1, true);

-- Insert Pro plan limits (Standard maps to Pro)
INSERT INTO public.plan_feature_limits (plan, feature_key, limit_value, is_unlimited) VALUES
  ('standard', 'resources', 15, false),
  ('standard', 'bookings_per_month', 100, false),
  ('standard', 'ai_calendar', -1, true),
  ('standard', 'ai_pricing', -1, true),
  ('standard', 'industries', 3, false),
  ('standard', 'double_booking_guard', -1, true),
  ('standard', 'calendar_sync', -1, true),
  ('standard', 'email_notifications', -1, true),
  ('standard', 'advanced_analytics', -1, true),
  ('standard', 'ai_scheduling', -1, true),
  ('standard', 'guest_scoring', -1, true),
  ('standard', 'competitor_radar', -1, true),
  ('standard', 'gap_filler', -1, true),
  ('standard', 'marketplace_access', -1, true),
  ('standard', 'priority_support', -1, true);

-- Insert Premium plan limits
INSERT INTO public.plan_feature_limits (plan, feature_key, limit_value, is_unlimited) VALUES
  ('premium', 'resources', -1, true),
  ('premium', 'bookings_per_month', -1, true),
  ('premium', 'ai_calendar', -1, true),
  ('premium', 'ai_pricing', -1, true),
  ('premium', 'industries', -1, true),
  ('premium', 'double_booking_guard', -1, true),
  ('premium', 'calendar_sync', -1, true),
  ('premium', 'email_notifications', -1, true),
  ('premium', 'advanced_analytics', -1, true),
  ('premium', 'ai_scheduling', -1, true),
  ('premium', 'guest_scoring', -1, true),
  ('premium', 'competitor_radar', -1, true),
  ('premium', 'gap_filler', -1, true),
  ('premium', 'marketplace_access', -1, true),
  ('premium', 'priority_support', -1, true),
  ('premium', 'ai_demand_forecasting', -1, true),
  ('premium', 'ai_conflict_resolution', -1, true),
  ('premium', 'revenue_optimizer', -1, true),
  ('premium', 'route_optimization', -1, true),
  ('premium', 'white_label', -1, true),
  ('premium', 'multi_team', -1, true),
  ('premium', 'custom_ai_training', -1, true),
  ('premium', 'dedicated_manager', -1, true),
  ('premium', 'api_access', -1, true);
