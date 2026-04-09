-- Add lifetime flag to subscriptions
ALTER TABLE public.subscriptions ADD COLUMN is_lifetime boolean NOT NULL DEFAULT false;

-- Create a function to check if user has lifetime access
CREATE OR REPLACE FUNCTION public.has_lifetime_access(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.subscriptions 
    WHERE user_id = _user_id AND is_lifetime = true
  )
$$;