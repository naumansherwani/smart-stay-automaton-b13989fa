
-- Railway Stations
CREATE TABLE public.railway_stations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  city TEXT,
  state TEXT,
  country TEXT DEFAULT 'Pakistan',
  latitude NUMERIC,
  longitude NUMERIC,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.railway_stations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own stations" ON public.railway_stations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own stations" ON public.railway_stations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own stations" ON public.railway_stations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own stations" ON public.railway_stations FOR DELETE USING (auth.uid() = user_id);

-- Railway Trains
CREATE TABLE public.railway_trains (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  train_number TEXT NOT NULL,
  train_name TEXT NOT NULL,
  train_type TEXT DEFAULT 'express',
  total_coaches INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active',
  metadata JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.railway_trains ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own trains" ON public.railway_trains FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own trains" ON public.railway_trains FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own trains" ON public.railway_trains FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own trains" ON public.railway_trains FOR DELETE USING (auth.uid() = user_id);

-- Railway Routes
CREATE TABLE public.railway_routes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  train_id UUID NOT NULL REFERENCES public.railway_trains(id) ON DELETE CASCADE,
  route_name TEXT NOT NULL,
  days_of_operation INTEGER[] DEFAULT '{1,2,3,4,5,6,7}'::integer[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.railway_routes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own routes" ON public.railway_routes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own routes" ON public.railway_routes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own routes" ON public.railway_routes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own routes" ON public.railway_routes FOR DELETE USING (auth.uid() = user_id);

-- Railway Route Stops
CREATE TABLE public.railway_route_stops (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  route_id UUID NOT NULL REFERENCES public.railway_routes(id) ON DELETE CASCADE,
  station_id UUID NOT NULL REFERENCES public.railway_stations(id) ON DELETE CASCADE,
  stop_sequence INTEGER NOT NULL,
  arrival_time TIME,
  departure_time TIME,
  day_offset INTEGER DEFAULT 0,
  distance_km NUMERIC DEFAULT 0,
  platform_number TEXT,
  halt_minutes INTEGER DEFAULT 2,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.railway_route_stops ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view route stops" ON public.railway_route_stops FOR SELECT
  USING (route_id IN (SELECT id FROM public.railway_routes WHERE user_id = auth.uid()));
CREATE POLICY "Users can insert route stops" ON public.railway_route_stops FOR INSERT
  WITH CHECK (route_id IN (SELECT id FROM public.railway_routes WHERE user_id = auth.uid()));
CREATE POLICY "Users can update route stops" ON public.railway_route_stops FOR UPDATE
  USING (route_id IN (SELECT id FROM public.railway_routes WHERE user_id = auth.uid()));
CREATE POLICY "Users can delete route stops" ON public.railway_route_stops FOR DELETE
  USING (route_id IN (SELECT id FROM public.railway_routes WHERE user_id = auth.uid()));

-- Railway Coaches
CREATE TABLE public.railway_coaches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  train_id UUID NOT NULL REFERENCES public.railway_trains(id) ON DELETE CASCADE,
  coach_number TEXT NOT NULL,
  coach_class TEXT NOT NULL DEFAULT 'economy',
  total_seats INTEGER DEFAULT 72,
  rows_count INTEGER DEFAULT 18,
  seats_per_row INTEGER DEFAULT 4,
  layout TEXT DEFAULT 'WA-AW',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.railway_coaches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view coaches" ON public.railway_coaches FOR SELECT
  USING (train_id IN (SELECT id FROM public.railway_trains WHERE user_id = auth.uid()));
CREATE POLICY "Users can insert coaches" ON public.railway_coaches FOR INSERT
  WITH CHECK (train_id IN (SELECT id FROM public.railway_trains WHERE user_id = auth.uid()));
CREATE POLICY "Users can update coaches" ON public.railway_coaches FOR UPDATE
  USING (train_id IN (SELECT id FROM public.railway_trains WHERE user_id = auth.uid()));
CREATE POLICY "Users can delete coaches" ON public.railway_coaches FOR DELETE
  USING (train_id IN (SELECT id FROM public.railway_trains WHERE user_id = auth.uid()));

-- Railway Seats
CREATE TABLE public.railway_seats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  coach_id UUID NOT NULL REFERENCES public.railway_coaches(id) ON DELETE CASCADE,
  seat_number TEXT NOT NULL,
  row_number INTEGER NOT NULL,
  position TEXT NOT NULL DEFAULT 'aisle',
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.railway_seats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view seats" ON public.railway_seats FOR SELECT
  USING (coach_id IN (SELECT c.id FROM public.railway_coaches c JOIN public.railway_trains t ON c.train_id = t.id WHERE t.user_id = auth.uid()));
CREATE POLICY "Users can insert seats" ON public.railway_seats FOR INSERT
  WITH CHECK (coach_id IN (SELECT c.id FROM public.railway_coaches c JOIN public.railway_trains t ON c.train_id = t.id WHERE t.user_id = auth.uid()));
CREATE POLICY "Users can update seats" ON public.railway_seats FOR UPDATE
  USING (coach_id IN (SELECT c.id FROM public.railway_coaches c JOIN public.railway_trains t ON c.train_id = t.id WHERE t.user_id = auth.uid()));
CREATE POLICY "Users can delete seats" ON public.railway_seats FOR DELETE
  USING (coach_id IN (SELECT c.id FROM public.railway_coaches c JOIN public.railway_trains t ON c.train_id = t.id WHERE t.user_id = auth.uid()));

-- Railway Schedules (specific date instances)
CREATE TABLE public.railway_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  route_id UUID NOT NULL REFERENCES public.railway_routes(id) ON DELETE CASCADE,
  schedule_date DATE NOT NULL,
  status TEXT DEFAULT 'scheduled',
  delay_minutes INTEGER DEFAULT 0,
  notes TEXT,
  ai_optimized BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(route_id, schedule_date)
);
ALTER TABLE public.railway_schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own schedules" ON public.railway_schedules FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own schedules" ON public.railway_schedules FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own schedules" ON public.railway_schedules FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own schedules" ON public.railway_schedules FOR DELETE USING (auth.uid() = user_id);

-- Railway Bookings
CREATE TABLE public.railway_bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  schedule_id UUID NOT NULL REFERENCES public.railway_schedules(id) ON DELETE CASCADE,
  from_station_id UUID NOT NULL REFERENCES public.railway_stations(id),
  to_station_id UUID NOT NULL REFERENCES public.railway_stations(id),
  from_stop_sequence INTEGER NOT NULL,
  to_stop_sequence INTEGER NOT NULL,
  coach_class TEXT NOT NULL DEFAULT 'economy',
  total_passengers INTEGER DEFAULT 1,
  base_price NUMERIC DEFAULT 0,
  ai_price NUMERIC DEFAULT 0,
  final_price NUMERIC DEFAULT 0,
  price_override BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'confirmed',
  booking_reference TEXT NOT NULL DEFAULT upper(substr(md5(random()::text), 1, 8)),
  booked_at TIMESTAMPTZ DEFAULT now(),
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.railway_bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own bookings" ON public.railway_bookings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own bookings" ON public.railway_bookings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own bookings" ON public.railway_bookings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own bookings" ON public.railway_bookings FOR DELETE USING (auth.uid() = user_id);

-- Railway Booking Passengers
CREATE TABLE public.railway_booking_passengers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES public.railway_bookings(id) ON DELETE CASCADE,
  passenger_name TEXT NOT NULL,
  age INTEGER,
  gender TEXT,
  seat_id UUID REFERENCES public.railway_seats(id),
  coach_id UUID REFERENCES public.railway_coaches(id),
  seat_number TEXT,
  status TEXT DEFAULT 'confirmed',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.railway_booking_passengers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own passengers" ON public.railway_booking_passengers FOR SELECT
  USING (booking_id IN (SELECT id FROM public.railway_bookings WHERE user_id = auth.uid()));
CREATE POLICY "Users can insert own passengers" ON public.railway_booking_passengers FOR INSERT
  WITH CHECK (booking_id IN (SELECT id FROM public.railway_bookings WHERE user_id = auth.uid()));
CREATE POLICY "Users can update own passengers" ON public.railway_booking_passengers FOR UPDATE
  USING (booking_id IN (SELECT id FROM public.railway_bookings WHERE user_id = auth.uid()));
CREATE POLICY "Users can delete own passengers" ON public.railway_booking_passengers FOR DELETE
  USING (booking_id IN (SELECT id FROM public.railway_bookings WHERE user_id = auth.uid()));

-- Railway Pricing Overrides
CREATE TABLE public.railway_pricing_overrides (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  train_id UUID REFERENCES public.railway_trains(id) ON DELETE CASCADE,
  route_id UUID REFERENCES public.railway_routes(id) ON DELETE CASCADE,
  from_station_id UUID REFERENCES public.railway_stations(id),
  to_station_id UUID REFERENCES public.railway_stations(id),
  coach_class TEXT,
  override_price NUMERIC NOT NULL,
  override_type TEXT DEFAULT 'fixed',
  reason TEXT,
  is_active BOOLEAN DEFAULT true,
  valid_from DATE,
  valid_until DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.railway_pricing_overrides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own overrides" ON public.railway_pricing_overrides FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own overrides" ON public.railway_pricing_overrides FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own overrides" ON public.railway_pricing_overrides FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own overrides" ON public.railway_pricing_overrides FOR DELETE USING (auth.uid() = user_id);

-- Railway Notifications
CREATE TABLE public.railway_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  booking_id UUID REFERENCES public.railway_bookings(id) ON DELETE SET NULL,
  schedule_id UUID REFERENCES public.railway_schedules(id) ON DELETE SET NULL,
  type TEXT NOT NULL DEFAULT 'info',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  channel TEXT DEFAULT 'in_app',
  is_read BOOLEAN DEFAULT false,
  sent_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.railway_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own notifications" ON public.railway_notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own notifications" ON public.railway_notifications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.railway_notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own notifications" ON public.railway_notifications FOR DELETE USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_railway_routes_train ON public.railway_routes(train_id);
CREATE INDEX idx_railway_route_stops_route ON public.railway_route_stops(route_id);
CREATE INDEX idx_railway_coaches_train ON public.railway_coaches(train_id);
CREATE INDEX idx_railway_seats_coach ON public.railway_seats(coach_id);
CREATE INDEX idx_railway_schedules_route ON public.railway_schedules(route_id);
CREATE INDEX idx_railway_schedules_date ON public.railway_schedules(schedule_date);
CREATE INDEX idx_railway_bookings_schedule ON public.railway_bookings(schedule_id);
CREATE INDEX idx_railway_booking_passengers_booking ON public.railway_booking_passengers(booking_id);
CREATE INDEX idx_railway_notifications_user ON public.railway_notifications(user_id);

-- Triggers for updated_at
CREATE TRIGGER update_railway_stations_updated_at BEFORE UPDATE ON public.railway_stations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_railway_trains_updated_at BEFORE UPDATE ON public.railway_trains FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_railway_routes_updated_at BEFORE UPDATE ON public.railway_routes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_railway_coaches_updated_at BEFORE UPDATE ON public.railway_coaches FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_railway_schedules_updated_at BEFORE UPDATE ON public.railway_schedules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_railway_bookings_updated_at BEFORE UPDATE ON public.railway_bookings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_railway_pricing_overrides_updated_at BEFORE UPDATE ON public.railway_pricing_overrides FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.railway_bookings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.railway_schedules;
ALTER PUBLICATION supabase_realtime ADD TABLE public.railway_notifications;
