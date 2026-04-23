
-- Drop Paddle-specific columns from subscriptions table
-- VIP/trial subs are preserved (they don't use these columns)
ALTER TABLE public.subscriptions DROP COLUMN IF EXISTS paddle_subscription_id;
ALTER TABLE public.subscriptions DROP COLUMN IF EXISTS paddle_customer_id;
ALTER TABLE public.subscriptions DROP COLUMN IF EXISTS environment;
ALTER TABLE public.subscriptions DROP COLUMN IF EXISTS product_id;
ALTER TABLE public.subscriptions DROP COLUMN IF EXISTS price_id;
ALTER TABLE public.subscriptions DROP COLUMN IF EXISTS cancel_at_period_end;

-- Drop Paddle-specific columns from payment_refunds (keep historical record of plan/amount/reason)
ALTER TABLE public.payment_refunds DROP COLUMN IF EXISTS paddle_subscription_id;
ALTER TABLE public.payment_refunds DROP COLUMN IF EXISTS paddle_transaction_id;
ALTER TABLE public.payment_refunds DROP COLUMN IF EXISTS paddle_adjustment_id;
ALTER TABLE public.payment_refunds DROP COLUMN IF EXISTS environment;

-- Update has_active_subscription to no longer require environment column
DROP FUNCTION IF EXISTS public.has_active_subscription(uuid, text);
CREATE OR REPLACE FUNCTION public.has_active_subscription(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.subscriptions
    WHERE user_id = _user_id
      AND status IN ('active', 'trialing')
      AND (current_period_end IS NULL OR current_period_end > now())
  )
$function$;
