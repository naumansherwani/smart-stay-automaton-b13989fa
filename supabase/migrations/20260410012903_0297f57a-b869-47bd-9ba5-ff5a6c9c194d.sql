-- Drop listing_inquiries first (has FK to service_listings)
DROP TABLE IF EXISTS public.listing_inquiries CASCADE;

-- Drop service_listings
DROP TABLE IF EXISTS public.service_listings CASCADE;