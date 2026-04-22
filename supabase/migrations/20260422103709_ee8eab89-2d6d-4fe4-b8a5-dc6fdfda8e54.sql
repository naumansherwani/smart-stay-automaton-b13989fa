-- Extend existing win_back_campaigns
ALTER TABLE public.win_back_campaigns
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS duration_months integer NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS expiry_days integer NOT NULL DEFAULT 7,
  ADD COLUMN IF NOT EXISTS target_plan text,
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

-- Per-user offers
CREATE TABLE IF NOT EXISTS public.win_back_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  campaign_id uuid REFERENCES public.win_back_campaigns(id) ON DELETE SET NULL,
  cancellation_request_id uuid REFERENCES public.cancellation_requests(id) ON DELETE SET NULL,
  language text NOT NULL DEFAULT 'en',
  voice_script text,
  text_message text,
  discount_code text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','sent','viewed','redeemed','rejected','expired')),
  approved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at timestamptz,
  sent_at timestamptz,
  viewed_at timestamptz,
  redeemed_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.win_back_offers ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_wbo_user ON public.win_back_offers(user_id, status);
CREATE INDEX IF NOT EXISTS idx_wbo_status ON public.win_back_offers(status);

DROP POLICY IF EXISTS "Users view own offers" ON public.win_back_offers;
CREATE POLICY "Users view own offers" ON public.win_back_offers FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users update own offers" ON public.win_back_offers;
CREATE POLICY "Users update own offers" ON public.win_back_offers FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins manage offers" ON public.win_back_offers;
CREATE POLICY "Admins manage offers" ON public.win_back_offers FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Insert own offers" ON public.win_back_offers;
CREATE POLICY "Insert own offers" ON public.win_back_offers FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR auth.uid() = user_id);

DROP TRIGGER IF EXISTS trg_wbo_updated ON public.win_back_offers;
CREATE TRIGGER trg_wbo_updated BEFORE UPDATE ON public.win_back_offers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Voice playback log
CREATE TABLE IF NOT EXISTS public.win_back_voice_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id uuid NOT NULL REFERENCES public.win_back_offers(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  language text NOT NULL,
  played_at timestamptz NOT NULL DEFAULT now(),
  duration_seconds integer,
  completed boolean DEFAULT false
);
ALTER TABLE public.win_back_voice_log ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_wbvl_offer ON public.win_back_voice_log(offer_id);

DROP POLICY IF EXISTS "View own voice log" ON public.win_back_voice_log;
CREATE POLICY "View own voice log" ON public.win_back_voice_log FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Insert own voice log" ON public.win_back_voice_log;
CREATE POLICY "Insert own voice log" ON public.win_back_voice_log FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);