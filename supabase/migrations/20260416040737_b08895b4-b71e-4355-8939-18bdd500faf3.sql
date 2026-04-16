
-- ══════════════════════════════════════════════════
-- EVENTS INDUSTRY TABLES
-- ══════════════════════════════════════════════════

CREATE TABLE public.venues (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'hall',
  capacity INTEGER NOT NULL DEFAULT 100,
  amenities TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'available',
  events_this_month INTEGER NOT NULL DEFAULT 0,
  utilization INTEGER NOT NULL DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own venues" ON public.venues FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  venue_id UUID REFERENCES public.venues(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  venue_name TEXT NOT NULL DEFAULT '',
  event_date TEXT NOT NULL,
  event_time TEXT NOT NULL DEFAULT '',
  duration TEXT DEFAULT '',
  category TEXT NOT NULL DEFAULT 'concert',
  capacity INTEGER NOT NULL DEFAULT 100,
  sold INTEGER NOT NULL DEFAULT 0,
  base_price NUMERIC NOT NULL DEFAULT 0,
  current_price NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'upcoming',
  demand TEXT NOT NULL DEFAULT 'medium',
  revenue NUMERIC NOT NULL DEFAULT 0,
  price_overridden BOOLEAN NOT NULL DEFAULT false,
  performers TEXT[] DEFAULT '{}',
  image TEXT DEFAULT '🎪',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own events" ON public.events FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.event_bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  event_name TEXT NOT NULL DEFAULT '',
  customer_name TEXT NOT NULL,
  email TEXT DEFAULT '',
  tickets INTEGER NOT NULL DEFAULT 1,
  ticket_type TEXT NOT NULL DEFAULT 'general',
  total_paid NUMERIC NOT NULL DEFAULT 0,
  booked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'confirmed',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.event_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own event bookings" ON public.event_bookings FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ══════════════════════════════════════════════════
-- LOGISTICS INDUSTRY TABLES
-- ══════════════════════════════════════════════════

CREATE TABLE public.logistics_vehicles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'van',
  plate TEXT DEFAULT '',
  capacity TEXT DEFAULT '',
  fuel INTEGER NOT NULL DEFAULT 100,
  status TEXT NOT NULL DEFAULT 'available',
  last_service TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.logistics_vehicles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own vehicles" ON public.logistics_vehicles FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.logistics_drivers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  phone TEXT DEFAULT '',
  license TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'available',
  rating NUMERIC NOT NULL DEFAULT 5.0,
  deliveries_today INTEGER NOT NULL DEFAULT 0,
  zone TEXT DEFAULT '',
  avatar TEXT DEFAULT '',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.logistics_drivers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own drivers" ON public.logistics_drivers FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.deliveries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  tracking TEXT NOT NULL DEFAULT '',
  origin TEXT NOT NULL DEFAULT '',
  destination TEXT NOT NULL DEFAULT '',
  customer TEXT NOT NULL DEFAULT '',
  weight TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending',
  priority TEXT NOT NULL DEFAULT 'standard',
  driver_id UUID REFERENCES public.logistics_drivers(id) ON DELETE SET NULL,
  driver_name TEXT DEFAULT '',
  vehicle_id UUID REFERENCES public.logistics_vehicles(id) ON DELETE SET NULL,
  time_slot TEXT DEFAULT '',
  eta TEXT DEFAULT '',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own deliveries" ON public.deliveries FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Triggers for updated_at
CREATE TRIGGER update_venues_updated_at BEFORE UPDATE ON public.venues FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_event_bookings_updated_at BEFORE UPDATE ON public.event_bookings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_logistics_vehicles_updated_at BEFORE UPDATE ON public.logistics_vehicles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_logistics_drivers_updated_at BEFORE UPDATE ON public.logistics_drivers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_deliveries_updated_at BEFORE UPDATE ON public.deliveries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
