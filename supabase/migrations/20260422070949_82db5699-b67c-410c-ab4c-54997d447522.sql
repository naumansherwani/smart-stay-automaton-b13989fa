
CREATE TABLE IF NOT EXISTS public.voice_assistant_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  industry text NOT NULL UNIQUE,
  enabled boolean NOT NULL DEFAULT true,
  latency_mode text NOT NULL DEFAULT 'streaming' CHECK (latency_mode IN ('streaming','standard')),
  voice_id text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

ALTER TABLE public.voice_assistant_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can read voice settings"
  ON public.voice_assistant_settings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert voice settings"
  ON public.voice_assistant_settings FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update voice settings"
  ON public.voice_assistant_settings FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete voice settings"
  ON public.voice_assistant_settings FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_voice_settings_updated_at
  BEFORE UPDATE ON public.voice_assistant_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.voice_assistant_settings (industry, enabled, latency_mode) VALUES
  ('hospitality', true, 'streaming'),
  ('airlines', true, 'streaming'),
  ('healthcare', true, 'streaming'),
  ('car_rental', true, 'streaming'),
  ('events_entertainment', true, 'streaming'),
  ('railways', true, 'streaming'),
  ('education', false, 'streaming'),
  ('logistics', false, 'streaming')
ON CONFLICT (industry) DO NOTHING;
