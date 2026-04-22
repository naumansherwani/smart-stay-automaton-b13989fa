
CREATE TABLE IF NOT EXISTS public.checkout_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id text NOT NULL,
  event_type text NOT NULL CHECK (event_type IN ('opened','abandoned','completed','rescued','rescue_shown','rescue_dismissed')),
  plan text,
  price_id text,
  source_page text,
  discount_code text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_checkout_events_user ON public.checkout_events(user_id);
CREATE INDEX IF NOT EXISTS idx_checkout_events_session ON public.checkout_events(session_id);
CREATE INDEX IF NOT EXISTS idx_checkout_events_type_time ON public.checkout_events(event_type, created_at DESC);

ALTER TABLE public.checkout_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own checkout events"
  ON public.checkout_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins view all checkout events"
  ON public.checkout_events FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can insert checkout events"
  ON public.checkout_events FOR INSERT
  WITH CHECK (true);
