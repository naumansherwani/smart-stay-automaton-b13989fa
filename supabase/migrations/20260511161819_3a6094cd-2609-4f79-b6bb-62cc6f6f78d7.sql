ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS recovery_email TEXT;

UPDATE public.profiles
SET recovery_email = 'naumankhansherwani@gmail.com'
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = 'naumansherwani@hostflowai.net'
);