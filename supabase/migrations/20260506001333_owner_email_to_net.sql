-- Update owner VIP check to use new .net domain
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _is_vip boolean := false;
  _vip_name text := NULL;
BEGIN
  IF NEW.email IN ('raanamasood1962@gmail.com', 'naumansherwani@hostflowai.net', 'naumansherwani@hostflowai.live') THEN
    _is_vip := true;
  END IF;

  IF NEW.email = 'raanamasood1962@gmail.com' THEN
    _vip_name := 'Mrs Raana Masood Sherwani';
  END IF;

  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(_vip_name, NEW.raw_user_meta_data->>'full_name', NEW.email));

  IF _is_vip THEN
    INSERT INTO public.subscriptions (user_id, plan, status, trial_starts_at, trial_ends_at, is_lifetime)
    VALUES (NEW.id, 'premium', 'active', now(), now() + interval '100 years', true);
  ELSE
    INSERT INTO public.subscriptions (user_id, plan, status, trial_starts_at, trial_ends_at)
    VALUES (NEW.id, 'trial', 'trialing', now(), now() + interval '7 days');
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, CASE WHEN _is_vip THEN 'admin'::app_role ELSE 'user'::app_role END);

  RETURN NEW;
END;
$$;
