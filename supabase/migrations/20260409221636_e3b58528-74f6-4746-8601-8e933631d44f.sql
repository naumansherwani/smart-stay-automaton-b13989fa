
CREATE TABLE public.translation_updates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  language_code TEXT NOT NULL UNIQUE,
  last_updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  version INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'current',
  translation_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.translation_updates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read translation updates"
  ON public.translation_updates FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can modify translation updates"
  ON public.translation_updates FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_translation_updates_updated_at
  BEFORE UPDATE ON public.translation_updates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Seed initial data for all supported languages
INSERT INTO public.translation_updates (language_code, status) VALUES
  ('en', 'current'), ('es', 'current'), ('zh', 'current'),
  ('de', 'current'), ('fr', 'current'), ('ar', 'current'),
  ('hi', 'current'), ('ja', 'current'), ('ko', 'current'),
  ('pt', 'current'), ('tr', 'current'), ('ur', 'current'),
  ('de-CH', 'current');
