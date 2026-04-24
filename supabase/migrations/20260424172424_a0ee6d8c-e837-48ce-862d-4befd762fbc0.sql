
-- =============================================================================
-- ARC LIFECYCLE EVENTS
-- =============================================================================
CREATE TABLE public.arc_lifecycle_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  event_type text NOT NULL, -- login, feature_used, trial_started, trial_day_3, trial_day_5, trial_ending, payment_failed, payment_succeeded, premium_drop, churned, reactivated, onboarding_step
  event_category text NOT NULL DEFAULT 'activity', -- activity | billing | lifecycle | risk
  industry text,
  plan text,
  feature_key text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_arc_events_user ON public.arc_lifecycle_events(user_id, created_at DESC);
CREATE INDEX idx_arc_events_type ON public.arc_lifecycle_events(event_type, created_at DESC);
CREATE INDEX idx_arc_events_category ON public.arc_lifecycle_events(event_category, created_at DESC);

ALTER TABLE public.arc_lifecycle_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users insert own events" ON public.arc_lifecycle_events
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users read own events" ON public.arc_lifecycle_events
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins read all events" ON public.arc_lifecycle_events
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- =============================================================================
-- USER HEALTH SCORES
-- =============================================================================
CREATE TABLE public.user_health_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  industry text,
  plan text,
  -- Composite score 0-100 (higher = healthier)
  health_score int NOT NULL DEFAULT 50,
  usage_score int NOT NULL DEFAULT 50,
  engagement_score int NOT NULL DEFAULT 50,
  payment_health_score int NOT NULL DEFAULT 100,
  -- Lifecycle phase from ARC closer logic
  lifecycle_phase text NOT NULL DEFAULT 'attract', -- attract | convert | retain | recover | champion
  trial_day int,
  days_since_last_action int,
  feature_count_30d int DEFAULT 0,
  recommended_action text,
  recommended_action_reason text,
  signals jsonb DEFAULT '{}'::jsonb,
  computed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_health_phase ON public.user_health_scores(lifecycle_phase, health_score);
CREATE INDEX idx_health_score ON public.user_health_scores(health_score);

ALTER TABLE public.user_health_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own health" ON public.user_health_scores
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins read all health" ON public.user_health_scores
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_user_health_scores_updated_at
  BEFORE UPDATE ON public.user_health_scores
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================================================
-- ARC ACTIONS LOG
-- =============================================================================
CREATE TABLE public.arc_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  rule_id uuid,
  phase text NOT NULL, -- attract | convert | retain | recover
  action_type text NOT NULL, -- email | ai_message | offer | discount | task_for_founder | voice_callback | nudge
  channel text DEFAULT 'system', -- email | in_app | dashboard | voice
  title text NOT NULL,
  body text,
  payload jsonb DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending', -- pending | executing | completed | failed | skipped
  result jsonb,
  triggered_by text DEFAULT 'arc_engine', -- arc_engine | founder | ai_adviser | manual
  executed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_arc_actions_user ON public.arc_actions(user_id, created_at DESC);
CREATE INDEX idx_arc_actions_status ON public.arc_actions(status);

ALTER TABLE public.arc_actions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage arc actions" ON public.arc_actions
  FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =============================================================================
-- ARC RULES (founder-editable triggers)
-- =============================================================================
CREATE TABLE public.arc_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  phase text NOT NULL, -- attract | convert | retain | recover
  trigger_type text NOT NULL, -- inactivity | trial_day | payment_failed | usage_drop | first_setup_incomplete | premium_value
  trigger_conditions jsonb NOT NULL DEFAULT '{}'::jsonb,
  action_template jsonb NOT NULL DEFAULT '{}'::jsonb, -- {type, title, body_template, channel}
  cooldown_hours int DEFAULT 72,
  is_active boolean NOT NULL DEFAULT true,
  priority int NOT NULL DEFAULT 50,
  industries text[], -- null = all industries
  trigger_count int NOT NULL DEFAULT 0,
  last_triggered_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.arc_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage arc rules" ON public.arc_rules
  FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_arc_rules_updated_at
  BEFORE UPDATE ON public.arc_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================================================
-- FOUNDER ACTION QUEUE (Phase 3 - read+suggest+approve)
-- =============================================================================
CREATE TABLE public.founder_action_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  founder_id uuid NOT NULL,
  proposed_by text NOT NULL DEFAULT 'ai_adviser', -- ai_adviser | arc_engine
  source_conversation_id uuid REFERENCES public.founder_ai_conversations(id) ON DELETE SET NULL,
  target_user_id uuid,
  action_type text NOT NULL, -- send_email | apply_discount | flag_user | create_task | message_user | win_back_offer
  title text NOT NULL,
  description text,
  ai_reasoning text,
  risk_level text NOT NULL DEFAULT 'low', -- low | medium | high
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending', -- pending | approved | rejected | executed | failed | expired
  decision_at timestamptz,
  executed_at timestamptz,
  result jsonb,
  expires_at timestamptz DEFAULT (now() + interval '7 days'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_founder_queue_status ON public.founder_action_queue(founder_id, status, created_at DESC);

ALTER TABLE public.founder_action_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Founder manages own queue" ON public.founder_action_queue
  FOR ALL USING (auth.uid() = founder_id AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (auth.uid() = founder_id AND public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_founder_action_queue_updated_at
  BEFORE UPDATE ON public.founder_action_queue
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================================================
-- SEED DEFAULT ARC RULES
-- =============================================================================
INSERT INTO public.arc_rules (name, description, phase, trigger_type, trigger_conditions, action_template, priority) VALUES
('Quick Start nudge', 'Trial user has not completed first setup within 24h', 'attract', 'first_setup_incomplete',
 '{"hours_since_signup": 24, "feature_count_lt": 2}'::jsonb,
 '{"type": "ai_message", "channel": "email", "title": "Get your first win in 5 min", "body_template": "Hi {{name}}, your HostFlow AI trial is ready. Here is the 5 min Quick Start so you see real ROI today."}'::jsonb,
 80),
('Day 5 ROI conversion', 'Trial day 5 — show ROI and upgrade prompt', 'convert', 'trial_day',
 '{"trial_day": 5}'::jsonb,
 '{"type": "ai_message", "channel": "email", "title": "You saved {{hours_saved}} hours this week", "body_template": "{{name}}, you used {{feature_count}} AI features and saved roughly £{{savings}} in admin time. Lock in this speed with Premium."}'::jsonb,
 90),
('Trial ending soon', 'Trial ends in 2 days', 'convert', 'trial_day',
 '{"trial_days_remaining": 2}'::jsonb,
 '{"type": "ai_message", "channel": "email", "title": "Your AI co-owner stops in 48h", "body_template": "Hi {{name}}, your trial ends in 2 days. Upgrade now and keep the autopilot running."}'::jsonb,
 95),
('Premium activity drop', 'Premium user usage dropped 60% vs prior 30d', 'retain', 'usage_drop',
 '{"drop_percent": 60, "plan": "premium"}'::jsonb,
 '{"type": "task_for_founder", "channel": "dashboard", "title": "Premium customer cooling off", "body_template": "{{name}} ({{company}}) usage dropped 60%. Reach out personally."}'::jsonb,
 95),
('Payment failed rescue', 'Recover failed payment within 24h', 'recover', 'payment_failed',
 '{"hours_since_failure": 0}'::jsonb,
 '{"type": "ai_message", "channel": "email", "title": "Quick payment fix", "body_template": "{{name}}, last payment did not go through. Update card here to avoid losing AI access."}'::jsonb,
 100),
('Inactive 14 days', 'User has not logged in 14+ days', 'retain', 'inactivity',
 '{"days_inactive": 14}'::jsonb,
 '{"type": "ai_message", "channel": "email", "title": "We miss you at HostFlow AI", "body_template": "{{name}}, here is a 20% comeback discount valid 7 days."}'::jsonb,
 70);
