
-- Remove old policy and recreate without the NULL listing_id bypass
DROP POLICY IF EXISTS "Only listing owner or inquiry sender can create conversations" ON public.conversations;

CREATE POLICY "Only listing owner or inquiry sender can create conversations"
ON public.conversations
FOR INSERT
TO authenticated
WITH CHECK (
  listing_id IS NOT NULL AND (
    -- Listing owner
    EXISTS (
      SELECT 1 FROM public.service_listings sl
      WHERE sl.id = listing_id AND sl.user_id = auth.uid()
    )
    OR
    -- Inquiry sender
    EXISTS (
      SELECT 1 FROM public.listing_inquiries li
      WHERE li.listing_id = conversations.listing_id AND li.sender_id = auth.uid()
    )
  )
);
