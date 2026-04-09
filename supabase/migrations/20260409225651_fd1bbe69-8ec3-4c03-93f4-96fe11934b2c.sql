
-- =============================================
-- FIX 1: Prevent price tampering on railway_bookings
-- =============================================
CREATE OR REPLACE FUNCTION public.prevent_railway_booking_tampering()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN
    IF NEW.final_price IS DISTINCT FROM OLD.final_price
       OR NEW.ai_price IS DISTINCT FROM OLD.ai_price
       OR NEW.base_price IS DISTINCT FROM OLD.base_price
       OR NEW.price_override IS DISTINCT FROM OLD.price_override
       OR NEW.status IS DISTINCT FROM OLD.status
       OR NEW.booking_reference IS DISTINCT FROM OLD.booking_reference
    THEN
      RAISE EXCEPTION 'Unauthorized: cannot modify protected booking fields';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER guard_railway_booking_fields
  BEFORE UPDATE ON public.railway_bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_railway_booking_tampering();

-- Also protect bookings table (same pattern)
CREATE OR REPLACE FUNCTION public.prevent_booking_tampering()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN
    IF NEW.total_price IS DISTINCT FROM OLD.total_price
       OR NEW.nightly_rate IS DISTINCT FROM OLD.nightly_rate
       OR NEW.cleaning_fee IS DISTINCT FROM OLD.cleaning_fee
       OR NEW.status IS DISTINCT FROM OLD.status
    THEN
      RAISE EXCEPTION 'Unauthorized: cannot modify protected booking fields';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER guard_booking_fields
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_booking_tampering();

-- =============================================
-- FIX 2: Change {public} policies to {authenticated}
-- =============================================

-- railway_coaches
DROP POLICY IF EXISTS "Users can view coaches" ON public.railway_coaches;
DROP POLICY IF EXISTS "Users can insert coaches" ON public.railway_coaches;
DROP POLICY IF EXISTS "Users can update coaches" ON public.railway_coaches;
DROP POLICY IF EXISTS "Users can delete coaches" ON public.railway_coaches;

CREATE POLICY "Users can view coaches" ON public.railway_coaches FOR SELECT TO authenticated
  USING (train_id IN (SELECT id FROM railway_trains WHERE user_id = auth.uid()));
CREATE POLICY "Users can insert coaches" ON public.railway_coaches FOR INSERT TO authenticated
  WITH CHECK (train_id IN (SELECT id FROM railway_trains WHERE user_id = auth.uid()));
CREATE POLICY "Users can update coaches" ON public.railway_coaches FOR UPDATE TO authenticated
  USING (train_id IN (SELECT id FROM railway_trains WHERE user_id = auth.uid()));
CREATE POLICY "Users can delete coaches" ON public.railway_coaches FOR DELETE TO authenticated
  USING (train_id IN (SELECT id FROM railway_trains WHERE user_id = auth.uid()));

-- railway_seats
DROP POLICY IF EXISTS "Users can view seats" ON public.railway_seats;
DROP POLICY IF EXISTS "Users can insert seats" ON public.railway_seats;
DROP POLICY IF EXISTS "Users can update seats" ON public.railway_seats;
DROP POLICY IF EXISTS "Users can delete seats" ON public.railway_seats;

CREATE POLICY "Users can view seats" ON public.railway_seats FOR SELECT TO authenticated
  USING (coach_id IN (SELECT c.id FROM railway_coaches c JOIN railway_trains t ON c.train_id = t.id WHERE t.user_id = auth.uid()));
CREATE POLICY "Users can insert seats" ON public.railway_seats FOR INSERT TO authenticated
  WITH CHECK (coach_id IN (SELECT c.id FROM railway_coaches c JOIN railway_trains t ON c.train_id = t.id WHERE t.user_id = auth.uid()));
CREATE POLICY "Users can update seats" ON public.railway_seats FOR UPDATE TO authenticated
  USING (coach_id IN (SELECT c.id FROM railway_coaches c JOIN railway_trains t ON c.train_id = t.id WHERE t.user_id = auth.uid()));
CREATE POLICY "Users can delete seats" ON public.railway_seats FOR DELETE TO authenticated
  USING (coach_id IN (SELECT c.id FROM railway_coaches c JOIN railway_trains t ON c.train_id = t.id WHERE t.user_id = auth.uid()));

-- railway_trains
DROP POLICY IF EXISTS "Users can view own trains" ON public.railway_trains;
DROP POLICY IF EXISTS "Users can insert own trains" ON public.railway_trains;
DROP POLICY IF EXISTS "Users can update own trains" ON public.railway_trains;
DROP POLICY IF EXISTS "Users can delete own trains" ON public.railway_trains;

CREATE POLICY "Users can view own trains" ON public.railway_trains FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own trains" ON public.railway_trains FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own trains" ON public.railway_trains FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own trains" ON public.railway_trains FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- railway_routes
DROP POLICY IF EXISTS "Users can view own routes" ON public.railway_routes;
DROP POLICY IF EXISTS "Users can insert own routes" ON public.railway_routes;
DROP POLICY IF EXISTS "Users can update own routes" ON public.railway_routes;
DROP POLICY IF EXISTS "Users can delete own routes" ON public.railway_routes;

CREATE POLICY "Users can view own routes" ON public.railway_routes FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own routes" ON public.railway_routes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own routes" ON public.railway_routes FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own routes" ON public.railway_routes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- railway_route_stops
DROP POLICY IF EXISTS "Users can view route stops" ON public.railway_route_stops;
DROP POLICY IF EXISTS "Users can insert route stops" ON public.railway_route_stops;
DROP POLICY IF EXISTS "Users can update route stops" ON public.railway_route_stops;
DROP POLICY IF EXISTS "Users can delete route stops" ON public.railway_route_stops;

CREATE POLICY "Users can view route stops" ON public.railway_route_stops FOR SELECT TO authenticated
  USING (route_id IN (SELECT id FROM railway_routes WHERE user_id = auth.uid()));
CREATE POLICY "Users can insert route stops" ON public.railway_route_stops FOR INSERT TO authenticated
  WITH CHECK (route_id IN (SELECT id FROM railway_routes WHERE user_id = auth.uid()));
CREATE POLICY "Users can update route stops" ON public.railway_route_stops FOR UPDATE TO authenticated
  USING (route_id IN (SELECT id FROM railway_routes WHERE user_id = auth.uid()));
CREATE POLICY "Users can delete route stops" ON public.railway_route_stops FOR DELETE TO authenticated
  USING (route_id IN (SELECT id FROM railway_routes WHERE user_id = auth.uid()));

-- railway_stations
DROP POLICY IF EXISTS "Users can view own stations" ON public.railway_stations;
DROP POLICY IF EXISTS "Users can insert own stations" ON public.railway_stations;
DROP POLICY IF EXISTS "Users can update own stations" ON public.railway_stations;
DROP POLICY IF EXISTS "Users can delete own stations" ON public.railway_stations;

CREATE POLICY "Users can view own stations" ON public.railway_stations FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own stations" ON public.railway_stations FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own stations" ON public.railway_stations FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own stations" ON public.railway_stations FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- railway_schedules
DROP POLICY IF EXISTS "Users can view own schedules" ON public.railway_schedules;
DROP POLICY IF EXISTS "Users can insert own schedules" ON public.railway_schedules;
DROP POLICY IF EXISTS "Users can update own schedules" ON public.railway_schedules;
DROP POLICY IF EXISTS "Users can delete own schedules" ON public.railway_schedules;

CREATE POLICY "Users can view own schedules" ON public.railway_schedules FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own schedules" ON public.railway_schedules FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own schedules" ON public.railway_schedules FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own schedules" ON public.railway_schedules FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- railway_pricing_overrides
DROP POLICY IF EXISTS "Users can view own overrides" ON public.railway_pricing_overrides;
DROP POLICY IF EXISTS "Users can insert own overrides" ON public.railway_pricing_overrides;
DROP POLICY IF EXISTS "Users can update own overrides" ON public.railway_pricing_overrides;
DROP POLICY IF EXISTS "Users can delete own overrides" ON public.railway_pricing_overrides;

CREATE POLICY "Users can view own overrides" ON public.railway_pricing_overrides FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own overrides" ON public.railway_pricing_overrides FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own overrides" ON public.railway_pricing_overrides FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own overrides" ON public.railway_pricing_overrides FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- railway_notifications
DROP POLICY IF EXISTS "Users can view own notifications" ON public.railway_notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.railway_notifications;
DROP POLICY IF EXISTS "Users can delete own notifications" ON public.railway_notifications;

CREATE POLICY "Users can view own notifications" ON public.railway_notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.railway_notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own notifications" ON public.railway_notifications FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- resources
DROP POLICY IF EXISTS "Users can view own resources" ON public.resources;
DROP POLICY IF EXISTS "Users can insert own resources" ON public.resources;
DROP POLICY IF EXISTS "Users can update own resources" ON public.resources;
DROP POLICY IF EXISTS "Users can delete own resources" ON public.resources;

CREATE POLICY "Users can view own resources" ON public.resources FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own resources" ON public.resources FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own resources" ON public.resources FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own resources" ON public.resources FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- schedule_settings
DROP POLICY IF EXISTS "Users can view own schedule settings" ON public.schedule_settings;
DROP POLICY IF EXISTS "Users can insert own schedule settings" ON public.schedule_settings;
DROP POLICY IF EXISTS "Users can update own schedule settings" ON public.schedule_settings;
DROP POLICY IF EXISTS "Users can delete own schedule settings" ON public.schedule_settings;

CREATE POLICY "Users can view own schedule settings" ON public.schedule_settings FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own schedule settings" ON public.schedule_settings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own schedule settings" ON public.schedule_settings FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own schedule settings" ON public.schedule_settings FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- withdrawal_requests (INSERT and SELECT for public -> authenticated)
DROP POLICY IF EXISTS "Users can create own withdrawals" ON public.withdrawal_requests;
DROP POLICY IF EXISTS "Users can view own withdrawals" ON public.withdrawal_requests;

CREATE POLICY "Users can create own withdrawals" ON public.withdrawal_requests FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own withdrawals" ON public.withdrawal_requests FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- profiles (INSERT and UPDATE for public -> authenticated)
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- user_roles (block policies from public -> authenticated)
DROP POLICY IF EXISTS "Block all deletes on user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "Block all inserts on user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "Block all updates on user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;

CREATE POLICY "Block all deletes on user_roles" ON public.user_roles FOR DELETE TO authenticated USING (false);
CREATE POLICY "Block all inserts on user_roles" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (false);
CREATE POLICY "Block all updates on user_roles" ON public.user_roles FOR UPDATE TO authenticated USING (false);
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- user_earnings (SELECT for public -> authenticated)
DROP POLICY IF EXISTS "Users can view own earnings" ON public.user_earnings;
CREATE POLICY "Users can view own earnings" ON public.user_earnings FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- subscriptions (SELECT for public -> authenticated)
DROP POLICY IF EXISTS "Users can view own subscription" ON public.subscriptions;
CREATE POLICY "Users can view own subscription" ON public.subscriptions FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- =============================================
-- FIX 3: Fix can_join_conversation authorization bypass
-- =============================================
CREATE OR REPLACE FUNCTION public.can_join_conversation(_conversation_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    -- User is already a participant
    EXISTS (
      SELECT 1 FROM public.conversation_participants cp
      WHERE cp.conversation_id = _conversation_id
        AND cp.user_id = auth.uid()
    )
    OR
    -- User owns the listing this conversation is about
    EXISTS (
      SELECT 1 FROM public.conversations c
      JOIN public.service_listings sl ON sl.id = c.listing_id
      WHERE c.id = _conversation_id
        AND sl.user_id = auth.uid()
    )
$$;
