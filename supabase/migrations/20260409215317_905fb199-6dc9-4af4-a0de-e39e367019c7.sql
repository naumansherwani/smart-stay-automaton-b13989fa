
-- Fix railway_bookings: restrict all policies to authenticated
DROP POLICY IF EXISTS "Users can view own bookings" ON public.railway_bookings;
DROP POLICY IF EXISTS "Users can insert own bookings" ON public.railway_bookings;
DROP POLICY IF EXISTS "Users can update own bookings" ON public.railway_bookings;
DROP POLICY IF EXISTS "Users can delete own bookings" ON public.railway_bookings;

CREATE POLICY "Users can view own bookings" ON public.railway_bookings FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own bookings" ON public.railway_bookings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own bookings" ON public.railway_bookings FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own bookings" ON public.railway_bookings FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Fix railway_booking_passengers: restrict to authenticated
DROP POLICY IF EXISTS "Users can view own passengers" ON public.railway_booking_passengers;
DROP POLICY IF EXISTS "Users can insert own passengers" ON public.railway_booking_passengers;
DROP POLICY IF EXISTS "Users can update own passengers" ON public.railway_booking_passengers;
DROP POLICY IF EXISTS "Users can delete own passengers" ON public.railway_booking_passengers;

CREATE POLICY "Users can view own passengers" ON public.railway_booking_passengers FOR SELECT TO authenticated USING (booking_id IN (SELECT id FROM railway_bookings WHERE user_id = auth.uid()));
CREATE POLICY "Users can insert own passengers" ON public.railway_booking_passengers FOR INSERT TO authenticated WITH CHECK (booking_id IN (SELECT id FROM railway_bookings WHERE user_id = auth.uid()));
CREATE POLICY "Users can update own passengers" ON public.railway_booking_passengers FOR UPDATE TO authenticated USING (booking_id IN (SELECT id FROM railway_bookings WHERE user_id = auth.uid()));
CREATE POLICY "Users can delete own passengers" ON public.railway_booking_passengers FOR DELETE TO authenticated USING (booking_id IN (SELECT id FROM railway_bookings WHERE user_id = auth.uid()));

-- Fix bookings: restrict to authenticated
DROP POLICY IF EXISTS "Users can view own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can insert own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can update own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can delete own bookings" ON public.bookings;

CREATE POLICY "Users can view own bookings" ON public.bookings FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own bookings" ON public.bookings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own bookings" ON public.bookings FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own bookings" ON public.bookings FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Fix alerts: restrict to authenticated
DROP POLICY IF EXISTS "Users can view own alerts" ON public.alerts;
DROP POLICY IF EXISTS "Users can insert own alerts" ON public.alerts;
DROP POLICY IF EXISTS "Users can update own alerts" ON public.alerts;
DROP POLICY IF EXISTS "Users can delete own alerts" ON public.alerts;

CREATE POLICY "Users can view own alerts" ON public.alerts FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own alerts" ON public.alerts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own alerts" ON public.alerts FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own alerts" ON public.alerts FOR DELETE TO authenticated USING (auth.uid() = user_id);
