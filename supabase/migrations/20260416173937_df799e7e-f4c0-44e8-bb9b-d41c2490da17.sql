DROP POLICY IF EXISTS "Only admins can insert earnings" ON public.user_earnings;
DROP POLICY IF EXISTS "Only admins can update earnings" ON public.user_earnings;
DROP POLICY IF EXISTS "Only admins can delete earnings" ON public.user_earnings;
DROP POLICY IF EXISTS "Block user updates on earnings" ON public.user_earnings;
DROP POLICY IF EXISTS "Block user deletes on earnings" ON public.user_earnings;

CREATE POLICY "Only admins can insert earnings"
ON public.user_earnings
AS RESTRICTIVE
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can update earnings"
ON public.user_earnings
AS RESTRICTIVE
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can delete earnings"
ON public.user_earnings
AS RESTRICTIVE
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));