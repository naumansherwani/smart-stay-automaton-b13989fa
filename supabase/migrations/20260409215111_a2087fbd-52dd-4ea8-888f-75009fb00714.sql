
-- 1. Fix conversations INSERT: restrict to listing owner or inquiry sender
DROP POLICY IF EXISTS "Authenticated users can create conversations" ON public.conversations;

CREATE POLICY "Only listing owner or inquiry sender can create conversations"
ON public.conversations
FOR INSERT
TO authenticated
WITH CHECK (
  -- Listing owner can create conversation for their listing
  (listing_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.service_listings sl
    WHERE sl.id = listing_id AND sl.user_id = auth.uid()
  ))
  OR
  -- User who sent an inquiry about this listing can create conversation
  (listing_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.listing_inquiries li
    WHERE li.listing_id = conversations.listing_id AND li.sender_id = auth.uid()
  ))
  OR
  -- Allow conversations without a listing (general type) — only via the atomic function
  (listing_id IS NULL)
);

-- 2. Remove redundant admin profile SELECT policy
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- 3. Allow authenticated users to read route stops on active routes (booking flow)
CREATE POLICY "Authenticated users can view active route stops"
ON public.railway_route_stops
FOR SELECT
TO authenticated
USING (
  route_id IN (
    SELECT id FROM public.railway_routes WHERE is_active = true
  )
);

-- 4. Allow authenticated users to view seats on active coaches (seat selection)
CREATE POLICY "Authenticated users can view active seats"
ON public.railway_seats
FOR SELECT
TO authenticated
USING (
  coach_id IN (
    SELECT c.id FROM public.railway_coaches c
    JOIN public.railway_trains t ON c.train_id = t.id
    WHERE c.is_active = true AND t.is_active = true
  )
);
