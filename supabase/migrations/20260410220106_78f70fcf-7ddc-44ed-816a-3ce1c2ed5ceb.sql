
-- CRM Activity Logs - tracks important CRM actions
CREATE TABLE public.crm_activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  industry text NOT NULL DEFAULT 'hospitality',
  action_type text NOT NULL, -- 'create', 'update', 'delete', 'export', 'bulk_action', 'login', 'email_sent'
  entity_type text NOT NULL, -- 'contact', 'deal', 'ticket', 'task', 'report'
  entity_id uuid NULL,
  description text,
  ip_hint text NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.crm_activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own logs" ON public.crm_activity_logs
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own logs" ON public.crm_activity_logs
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all logs" ON public.crm_activity_logs
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_crm_activity_logs_user ON public.crm_activity_logs(user_id, created_at DESC);
CREATE INDEX idx_crm_activity_logs_action ON public.crm_activity_logs(action_type, created_at DESC);

-- CRM Security Alerts
CREATE TABLE public.crm_security_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  alert_type text NOT NULL, -- 'bulk_export', 'rapid_downloads', 'mass_edit', 'mass_delete', 'unusual_hours'
  severity text NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  title text NOT NULL,
  message text NOT NULL,
  is_resolved boolean DEFAULT false,
  resolved_at timestamptz NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.crm_security_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own alerts" ON public.crm_security_alerts
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can update own alerts" ON public.crm_security_alerts
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own alerts" ON public.crm_security_alerts
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all alerts" ON public.crm_security_alerts
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_crm_security_alerts_user ON public.crm_security_alerts(user_id, created_at DESC);

-- Function to detect suspicious activity and create alerts
CREATE OR REPLACE FUNCTION public.check_crm_security()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recent_count integer;
  alert_title text;
  alert_msg text;
BEGIN
  -- Check for bulk deletes (>5 in 1 minute)
  IF NEW.action_type = 'delete' THEN
    SELECT count(*) INTO recent_count
    FROM crm_activity_logs
    WHERE user_id = NEW.user_id
      AND action_type = 'delete'
      AND created_at > now() - interval '1 minute';
    IF recent_count >= 5 THEN
      INSERT INTO crm_security_alerts (user_id, alert_type, severity, title, message, metadata)
      VALUES (NEW.user_id, 'mass_delete', 'high',
        'Unusual Delete Activity Detected',
        recent_count || ' records deleted in the last minute. This may indicate accidental or unauthorized deletion.',
        jsonb_build_object('count', recent_count, 'entity_type', NEW.entity_type));
    END IF;
  END IF;

  -- Check for bulk exports (>3 in 5 minutes)
  IF NEW.action_type = 'export' THEN
    SELECT count(*) INTO recent_count
    FROM crm_activity_logs
    WHERE user_id = NEW.user_id
      AND action_type = 'export'
      AND created_at > now() - interval '5 minutes';
    IF recent_count >= 3 THEN
      INSERT INTO crm_security_alerts (user_id, alert_type, severity, title, message)
      VALUES (NEW.user_id, 'bulk_export', 'critical',
        'Bulk Data Export Detected',
        recent_count || ' export actions in 5 minutes. Potential data exfiltration risk.');
    END IF;
  END IF;

  -- Check for mass edits (>10 in 1 minute)
  IF NEW.action_type = 'update' THEN
    SELECT count(*) INTO recent_count
    FROM crm_activity_logs
    WHERE user_id = NEW.user_id
      AND action_type = 'update'
      AND created_at > now() - interval '1 minute';
    IF recent_count >= 10 THEN
      INSERT INTO crm_security_alerts (user_id, alert_type, severity, title, message)
      VALUES (NEW.user_id, 'mass_edit', 'medium',
        'Rapid Edit Activity',
        recent_count || ' records edited in 1 minute. Please verify this is intentional.');
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_crm_security_check
AFTER INSERT ON public.crm_activity_logs
FOR EACH ROW EXECUTE FUNCTION public.check_crm_security();
