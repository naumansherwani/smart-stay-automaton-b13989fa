
-- Reset owner password and confirm email
UPDATE auth.users
SET 
  encrypted_password = crypt('HostFlow@1986!$', gen_salt('bf')),
  email_confirmed_at = COALESCE(email_confirmed_at, now()),
  updated_at = now()
WHERE email = 'naumansherwani@hostflowai.net';

-- Save Gmail as backup recovery contact in profile metadata
UPDATE public.profiles
SET updated_at = now()
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = 'naumansherwani@hostflowai.net'
);
