
-- Remove sensitive tables from realtime to prevent eavesdropping
DO $$
BEGIN
  -- Only drop if the table is part of the publication
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'bookings'
  ) THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.bookings;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'railway_bookings'
  ) THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.railway_bookings;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'railway_notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.railway_notifications;
  END IF;
END $$;
