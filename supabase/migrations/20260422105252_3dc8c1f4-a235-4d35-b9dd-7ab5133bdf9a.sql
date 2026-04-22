
-- ============= PAYMENT REFUNDS (live refund_rate metric) =============
CREATE TABLE IF NOT EXISTS public.payment_refunds (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  paddle_subscription_id TEXT,
  paddle_transaction_id TEXT,
  paddle_adjustment_id TEXT UNIQUE,
  plan TEXT,
  amount NUMERIC NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  reason TEXT,
  reason_details TEXT,
  status TEXT NOT NULL DEFAULT 'completed',
  environment TEXT DEFAULT 'production',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.payment_refunds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view all refunds" ON public.payment_refunds
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users view own refunds" ON public.payment_refunds
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role manages refunds" ON public.payment_refunds
  FOR ALL TO public
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE INDEX IF NOT EXISTS idx_payment_refunds_created ON public.payment_refunds(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_refunds_user ON public.payment_refunds(user_id);

-- ============= ADMIN ALERTS (real-time inbox) =============
CREATE TABLE IF NOT EXISTS public.admin_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  alert_type TEXT NOT NULL, -- 'high_value_churn' | 'refund_spike' | 'payment_failed' | 'churn_spike' | 'mrr_milestone' | 'trial_drop'
  severity TEXT NOT NULL DEFAULT 'medium', -- 'critical' | 'high' | 'medium' | 'low' | 'good'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  related_user_id UUID,
  related_entity_type TEXT, -- 'subscription' | 'refund' | 'cancellation'
  related_entity_id UUID,
  amount NUMERIC,
  metadata JSONB DEFAULT '{}'::jsonb,
  is_read BOOLEAN DEFAULT FALSE,
  is_resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view all admin alerts" ON public.admin_alerts
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins update admin alerts" ON public.admin_alerts
  FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins delete admin alerts" ON public.admin_alerts
  FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Service role inserts admin alerts" ON public.admin_alerts
  FOR INSERT TO public WITH CHECK (auth.role() = 'service_role' OR has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX IF NOT EXISTS idx_admin_alerts_created ON public.admin_alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_alerts_unread ON public.admin_alerts(is_read) WHERE is_read = FALSE;

-- Realtime
ALTER TABLE public.admin_alerts REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_alerts;
ALTER TABLE public.payment_refunds REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.payment_refunds;

-- ============= HIGH-VALUE CHURN TRIGGER =============
-- When a subscription is canceled, create admin_alert if user is "high value"
-- High value = premium plan OR total_revenue > $200 (via crm_contacts) OR active >90 days

CREATE OR REPLACE FUNCTION public.notify_high_value_churn()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan TEXT;
  v_days_active INT;
  v_email TEXT;
  v_company TEXT;
  v_is_high_value BOOLEAN := FALSE;
  v_severity TEXT := 'medium';
BEGIN
  -- Only trigger on transition to canceled
  IF NEW.status = 'canceled' AND (OLD.status IS DISTINCT FROM 'canceled') THEN
    v_plan := COALESCE(NEW.plan, 'unknown');
    v_days_active := EXTRACT(DAY FROM (now() - NEW.created_at))::INT;

    SELECT email, company_name INTO v_email, v_company
    FROM public.profiles WHERE user_id = NEW.user_id LIMIT 1;

    IF v_plan = 'premium' THEN
      v_is_high_value := TRUE;
      v_severity := 'critical';
    ELSIF v_plan = 'pro' AND v_days_active > 60 THEN
      v_is_high_value := TRUE;
      v_severity := 'high';
    ELSIF v_days_active > 180 THEN
      v_is_high_value := TRUE;
      v_severity := 'high';
    END IF;

    IF v_is_high_value THEN
      INSERT INTO public.admin_alerts (
        alert_type, severity, title, message,
        related_user_id, related_entity_type, related_entity_id, metadata
      ) VALUES (
        'high_value_churn',
        v_severity,
        '🚨 High-Value Churn: ' || COALESCE(v_company, v_email, 'User'),
        COALESCE(v_company, v_email, 'A user') || ' (' || v_plan || ' plan, ' || v_days_active || ' days active) just canceled. Immediate win-back recommended.',
        NEW.user_id, 'subscription', NEW.id,
        jsonb_build_object('plan', v_plan, 'days_active', v_days_active, 'email', v_email)
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_high_value_churn ON public.subscriptions;
CREATE TRIGGER trg_high_value_churn
  AFTER UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_high_value_churn();

-- ============= REFUND ALERT TRIGGER =============
CREATE OR REPLACE FUNCTION public.notify_refund_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email TEXT;
  v_severity TEXT := 'medium';
BEGIN
  SELECT email INTO v_email FROM public.profiles WHERE user_id = NEW.user_id LIMIT 1;

  IF NEW.amount >= 100 THEN v_severity := 'high'; END IF;
  IF NEW.amount >= 500 THEN v_severity := 'critical'; END IF;

  INSERT INTO public.admin_alerts (
    alert_type, severity, title, message,
    related_user_id, related_entity_type, related_entity_id, amount, metadata
  ) VALUES (
    'refund_issued',
    v_severity,
    '💸 Refund Issued: $' || NEW.amount::text,
    COALESCE(v_email, 'A user') || ' was refunded $' || NEW.amount::text || COALESCE(' — reason: ' || NEW.reason, '') || '.',
    NEW.user_id, 'refund', NEW.id, NEW.amount,
    jsonb_build_object('plan', NEW.plan, 'reason', NEW.reason)
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_refund_alert ON public.payment_refunds;
CREATE TRIGGER trg_refund_alert
  AFTER INSERT ON public.payment_refunds
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_refund_event();
