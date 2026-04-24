CREATE OR REPLACE FUNCTION public.get_launch_discount_status()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  basic_count INT;
  pro_count INT;
  premium_count INT;
  campaign_start TIMESTAMPTZ := '2026-04-24 00:00:00+00';
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
$function$;