
CREATE OR REPLACE FUNCTION public.can_join_conversation(_conversation_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    -- User owns the listing this conversation is about
    EXISTS (
      SELECT 1 FROM public.conversations c
      JOIN public.service_listings sl ON sl.id = c.listing_id
      WHERE c.id = _conversation_id
        AND sl.user_id = auth.uid()
    )
    OR
    -- User sent an inquiry about the listing this conversation is about
    EXISTS (
      SELECT 1 FROM public.conversations c
      JOIN public.listing_inquiries li ON li.listing_id = c.listing_id
      WHERE c.id = _conversation_id
        AND li.sender_id = auth.uid()
    )
$$;
