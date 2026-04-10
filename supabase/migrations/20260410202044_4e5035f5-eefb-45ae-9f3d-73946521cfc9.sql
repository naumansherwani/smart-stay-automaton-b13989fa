-- Drop the existing permissive policy that doesn't truly block
DROP POLICY IF EXISTS "Block all inserts on user_roles" ON public.user_roles;

-- Create RESTRICTIVE policy to guarantee inserts are always blocked
-- RESTRICTIVE policies must ALL pass (AND logic), so false = always denied
CREATE POLICY "Block all inserts on user_roles"
ON public.user_roles
AS RESTRICTIVE
FOR INSERT
TO authenticated
WITH CHECK (false);

-- Block updates on user_roles (prevent role modification)
DROP POLICY IF EXISTS "Block all updates on user_roles" ON public.user_roles;
CREATE POLICY "Block all updates on user_roles"
ON public.user_roles
AS RESTRICTIVE
FOR UPDATE
TO authenticated
USING (false);

-- Block deletes on user_roles (prevent role removal)
DROP POLICY IF EXISTS "Block all deletes on user_roles" ON public.user_roles;
CREATE POLICY "Block all deletes on user_roles"
ON public.user_roles
AS RESTRICTIVE
FOR DELETE
TO authenticated
USING (false);