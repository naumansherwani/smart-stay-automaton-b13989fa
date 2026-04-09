
-- 1. Remove the old permissive policy that bypasses authorization
DROP POLICY IF EXISTS "Authenticated users can join conversations" ON public.conversation_participants;

-- 2. Tighten can_join_conversation to be conversation-specific
CREATE OR REPLACE FUNCTION public.can_join_conversation(_conversation_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    -- Conversation has no participants yet (creator joins first)
    NOT EXISTS (
      SELECT 1 FROM public.conversation_participants 
      WHERE conversation_id = _conversation_id
    )
    OR
    -- User owns the listing this conversation is about
    EXISTS (
      SELECT 1 FROM public.conversations c
      JOIN public.service_listings sl ON sl.id = c.listing_id
      WHERE c.id = _conversation_id
        AND sl.user_id = auth.uid()
    )
    OR
    -- User already is a participant (e.g., re-joining)
    EXISTS (
      SELECT 1 FROM public.conversation_participants cp
      WHERE cp.conversation_id = _conversation_id
        AND cp.user_id = auth.uid()
    )
$$;
