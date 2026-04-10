
-- Remove broad SELECT policies that expose data to all authenticated users
DROP POLICY IF EXISTS "Authenticated users can view active route stops" ON public.railway_route_stops;
DROP POLICY IF EXISTS "Authenticated users can view active seats" ON public.railway_seats;
