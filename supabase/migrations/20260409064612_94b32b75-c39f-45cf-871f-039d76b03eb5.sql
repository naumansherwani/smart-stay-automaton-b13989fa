
-- Allow admins to read all profiles
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to read all bookings
CREATE POLICY "Admins can view all bookings"
ON public.bookings
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to read all resources
CREATE POLICY "Admins can view all resources"
ON public.resources
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to read all subscriptions
CREATE POLICY "Admins can view all subscriptions"
ON public.subscriptions
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
