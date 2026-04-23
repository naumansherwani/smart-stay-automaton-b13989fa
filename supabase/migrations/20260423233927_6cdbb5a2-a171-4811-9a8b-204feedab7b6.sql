
-- Add Polar fields to subscriptions
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS polar_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS polar_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS polar_product_id TEXT,
  ADD COLUMN IF NOT EXISTS discount_applied BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS discount_percent INT,
  ADD COLUMN IF NOT EXISTS discount_locked_until TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS failed_payment_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_polar_sub
  ON public.subscriptions(polar_subscription_id) WHERE polar_subscription_id IS NOT NULL;

-- Launch discount redemptions
CREATE TABLE IF NOT EXISTS public.launch_discount_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  user_email TEXT,
  plan TEXT NOT NULL CHECK (plan IN ('basic','pro','premium')),
  discount_percent INT NOT NULL,
  original_price NUMERIC(10,2) NOT NULL,
  discounted_price NUMERIC(10,2) NOT NULL,
  polar_subscription_id TEXT,
  polar_checkout_id TEXT,
  redeemed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  locked_until TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, plan)
);

ALTER TABLE public.launch_discount_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own redemption"
  ON public.launch_discount_redemptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins view all redemptions"
  ON public.launch_discount_redemptions FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- No INSERT/UPDATE/DELETE policy => only service_role (edge functions) can write

CREATE INDEX IF NOT EXISTS idx_redemptions_plan ON public.launch_discount_redemptions(plan);
CREATE INDEX IF NOT EXISTS idx_redemptions_user ON public.launch_discount_redemptions(user_id);

-- Live status function
CREATE OR REPLACE FUNCTION public.get_launch_discount_status()
RETURNS JSONB
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  basic_count INT;
  pro_count INT;
  premium_count INT;
  campaign_start TIMESTAMPTZ := '2026-04-30 00:00:00+00';
  campaign_end TIMESTAMPTZ := '2026-07-31 23:59:59+00';
  now_ts TIMESTAMPTZ := now();
  cap INT := 100;
BEGIN
  SELECT count(*) INTO basic_count FROM launch_discount_redemptions WHERE plan = 'basic';
  SELECT count(*) INTO pro_count FROM launch_discount_redemptions WHERE plan = 'pro';
  SELECT count(*) INTO premium_count FROM launch_discount_redemptions WHERE plan = 'premium';

  RETURN jsonb_build_object(
    'campaign_start', campaign_start,
    'campaign_end', campaign_end,
    'now', now_ts,
    'cap_per_plan', cap,
    'plans', jsonb_build_object(
      'basic', jsonb_build_object(
        'discount_percent', 12,
        'redeemed', basic_count,
        'remaining', GREATEST(0, cap - basic_count),
        'status', CASE
          WHEN now_ts < campaign_start THEN 'upcoming'
          WHEN now_ts > campaign_end THEN 'expired'
          WHEN basic_count >= cap THEN 'sold_out'
          ELSE 'active'
        END
      ),
      'pro', jsonb_build_object(
        'discount_percent', 15,
        'redeemed', pro_count,
        'remaining', GREATEST(0, cap - pro_count),
        'status', CASE
          WHEN now_ts < campaign_start THEN 'upcoming'
          WHEN now_ts > campaign_end THEN 'expired'
          WHEN pro_count >= cap THEN 'sold_out'
          ELSE 'active'
        END
      ),
      'premium', jsonb_build_object(
        'discount_percent', 20,
        'redeemed', premium_count,
        'remaining', GREATEST(0, cap - premium_count),
        'status', CASE
          WHEN now_ts < campaign_start THEN 'upcoming'
          WHEN now_ts > campaign_end THEN 'expired'
          WHEN premium_count >= cap THEN 'sold_out'
          ELSE 'active'
        END
      )
    )
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_launch_discount_status() TO anon, authenticated;
