CREATE TABLE public.price_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  industry TEXT NOT NULL,
  resource_name TEXT NOT NULL,
  alert_type TEXT NOT NULL DEFAULT 'price_change',
  current_price NUMERIC NOT NULL,
  suggested_price NUMERIC NOT NULL,
  change_percent NUMERIC NOT NULL DEFAULT 0,
  reasoning TEXT,
  confidence TEXT DEFAULT 'medium',
  is_read BOOLEAN DEFAULT false,
  is_applied BOOLEAN DEFAULT false,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.price_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own price alerts"
ON public.price_alerts FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own price alerts"
ON public.price_alerts FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Service can insert price alerts"
ON public.price_alerts FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_price_alerts_user_unread ON public.price_alerts (user_id, is_read) WHERE is_read = false;
CREATE INDEX idx_price_alerts_industry ON public.price_alerts (industry);

CREATE TRIGGER update_price_alerts_updated_at
BEFORE UPDATE ON public.price_alerts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();