-- Add business_subtype to profiles for sub-industry selection
ALTER TABLE public.profiles 
ADD COLUMN business_subtype text DEFAULT NULL;

-- Add comment for clarity
COMMENT ON COLUMN public.profiles.business_subtype IS 'Sub-type within an industry, e.g. hotel_property or travel_tours for hospitality';