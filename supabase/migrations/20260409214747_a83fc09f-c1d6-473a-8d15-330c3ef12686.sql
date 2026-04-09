
-- 1. Create atomic function to create conversation + add creator as participant
CREATE OR REPLACE FUNCTION public.create_conversation_with_participant(
  _listing_id uuid DEFAULT NULL,
  _type text DEFAULT 'deal_based'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _conversation_id uuid;
BEGIN
  INSERT INTO public.conversations (listing_id, type)
  VALUES (_listing_id, _type)
  RETURNING id INTO _conversation_id;

  INSERT INTO public.conversation_participants (conversation_id, user_id)
  VALUES (_conversation_id, auth.uid());

  RETURN _conversation_id;
END;
$$;

-- 2. Fix can_join_conversation - remove "no participants" bypass
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
    -- User already is a participant
    EXISTS (
      SELECT 1 FROM public.conversation_participants cp
      WHERE cp.conversation_id = _conversation_id
        AND cp.user_id = auth.uid()
    )
$$;
