
ALTER TABLE public.resources ADD COLUMN IF NOT EXISTS business_type text DEFAULT 'hotel';
ALTER TABLE public.resources ADD COLUMN IF NOT EXISTS minimum_stay integer DEFAULT 1;
