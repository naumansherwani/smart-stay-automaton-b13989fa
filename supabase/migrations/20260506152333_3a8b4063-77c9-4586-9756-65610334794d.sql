UPDATE public.plan_feature_limits
SET limit_value = 8,
    is_unlimited = false
WHERE plan = 'premium'
  AND feature_key = 'industries'
  AND limit_value <> 8;