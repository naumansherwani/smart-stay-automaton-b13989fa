
CREATE TABLE IF NOT EXISTS public.founder_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  autopilot_enabled boolean NOT NULL DEFAULT false,
  autopilot_level text NOT NULL DEFAULT 'conservative',
  weekly_report_enabled boolean NOT NULL DEFAULT false,
  weekly_report_email text,
  last_weekly_sent_at timestamptz,
  voice_enabled boolean NOT NULL DEFAULT true,
  preferred_language text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.founder_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Founder can view own settings"
  ON public.founder_settings FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Founder can insert own settings"
  ON public.founder_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Founder can update own settings"
  ON public.founder_settings FOR UPDATE
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER founder_settings_updated_at
  BEFORE UPDATE ON public.founder_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
