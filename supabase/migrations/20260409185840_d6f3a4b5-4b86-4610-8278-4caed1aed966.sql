
-- Drop the overly permissive SELECT policy
DROP POLICY "Authenticated users can view all profiles" ON public.profiles;

-- Create a public view with only non-sensitive fields
CREATE VIEW public.profiles_public
WITH (security_invoker = on) AS
  SELECT id, user_id, display_name, avatar_url, bio, industry, company_name, verified, created_at
  FROM public.profiles;

-- Allow all authenticated users to read the public view's underlying rows
-- but only the columns exposed by the view
CREATE POLICY "Authenticated users can view public profile fields"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR has_role(auth.uid(), 'admin'::app_role)
  );
