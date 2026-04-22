
-- Cancellation requests (full retention wizard log)
CREATE TABLE public.cancellation_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  subscription_id uuid,
  reason text NOT NULL, -- expensive | low_usage | missing_features | technical | competitor | temporary_break | other
  reason_details text,
  competitor_name text,
  feature_requested text,
  value_summary jsonb DEFAULT '{}'::jsonb, -- {logins, ai_tasks, hours_saved, revenue_opportunities, languages_used, usage_score}
  offer_shown text, -- e.g. discount_20, pause_30, downgrade_pro
  final_action text NOT NULL DEFAULT 'pending', -- stayed | paused | downgraded | canceled
  country text,
  industry text,
  plan text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.cancellation_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users view own cancellations" ON public.cancellation_requests
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "users insert own cancellations" ON public.cancellation_requests
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users update own cancellations" ON public.cancellation_requests
  FOR UPDATE TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_cancellation_user ON public.cancellation_requests(user_id);
CREATE INDEX idx_cancellation_created ON public.cancellation_requests(created_at DESC);

-- Subscription pauses
CREATE TABLE public.subscription_pauses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  subscription_id uuid,
  pause_days integer NOT NULL CHECK (pause_days IN (7, 30, 60)),
  starts_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'active', -- active | ended | canceled
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.subscription_pauses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users view own pauses" ON public.subscription_pauses
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "users insert own pauses" ON public.subscription_pauses
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users update own pauses" ON public.subscription_pauses
  FOR UPDATE TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- Retention offers shown / accepted
CREATE TABLE public.retention_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  cancellation_request_id uuid REFERENCES public.cancellation_requests(id) ON DELETE CASCADE,
  offer_type text NOT NULL, -- discount_20 | pause_30 | downgrade_pro | priority_support | custom
  discount_percent integer,
  duration_days integer,
  status text NOT NULL DEFAULT 'shown', -- shown | accepted | declined | expired
  accepted_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.retention_offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users view own offers" ON public.retention_offers
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "users insert own offers" ON public.retention_offers
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users update own offers" ON public.retention_offers
  FOR UPDATE TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- Churn risk scores (AI predictions)
CREATE TABLE public.churn_risk_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  risk_score integer NOT NULL CHECK (risk_score BETWEEN 0 AND 100),
  cancel_probability numeric(5,2) NOT NULL DEFAULT 0,
  signals jsonb DEFAULT '{}'::jsonb, -- {no_login_days, low_usage, incomplete_onboarding, payment_issue, complaints}
  suggested_action text,
  computed_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.churn_risk_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users view own risk" ON public.churn_risk_scores
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins write risk" ON public.churn_risk_scores
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Win-back campaigns (admin)
CREATE TABLE public.win_back_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid NOT NULL,
  name text NOT NULL,
  campaign_type text NOT NULL DEFAULT 'discount', -- discount | upgrade_return | seasonal
  discount_percent integer,
  target_audience text NOT NULL DEFAULT 'all_canceled', -- all_canceled | high_value | specific_reason
  target_reason text,
  message text,
  sent_count integer NOT NULL DEFAULT 0,
  reactivated_count integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'draft', -- draft | active | completed
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.win_back_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins manage campaigns" ON public.win_back_campaigns
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Exit surveys with AI summaries
CREATE TABLE public.exit_surveys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  cancellation_request_id uuid REFERENCES public.cancellation_requests(id) ON DELETE CASCADE,
  free_text text,
  satisfaction_score integer CHECK (satisfaction_score BETWEEN 1 AND 10),
  would_recommend boolean,
  ai_summary text,
  ai_recommendations jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.exit_surveys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users view own surveys" ON public.exit_surveys
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "users insert own surveys" ON public.exit_surveys
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "admins update surveys" ON public.exit_surveys
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Triggers for updated_at
CREATE TRIGGER trg_cancellation_updated BEFORE UPDATE ON public.cancellation_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_winback_updated BEFORE UPDATE ON public.win_back_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
