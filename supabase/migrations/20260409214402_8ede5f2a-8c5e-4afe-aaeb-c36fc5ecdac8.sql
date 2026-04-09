
-- ==========================================
-- 1. Explicit DENY on user_roles modifications
-- ==========================================
CREATE POLICY "Block all inserts on user_roles"
  ON public.user_roles FOR INSERT
  TO public, authenticated
  WITH CHECK (false);

CREATE POLICY "Block all updates on user_roles"
  ON public.user_roles FOR UPDATE
  TO public, authenticated
  USING (false);

CREATE POLICY "Block all deletes on user_roles"
  ON public.user_roles FOR DELETE
  TO public, authenticated
  USING (false);

-- ==========================================
-- 2. Fix user_earnings INSERT - ensure admin-only
-- ==========================================
DROP POLICY IF EXISTS "Admins can insert earnings" ON public.user_earnings;

CREATE POLICY "Only admins can insert earnings"
  ON public.user_earnings FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'admin'
    )
  );

-- ==========================================
-- 3. Fix conversation_participants - proper ownership
-- Create a security definer function to check conversation access
-- ==========================================
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
    -- User is the inquiry sender for this listing conversation
    EXISTS (
      SELECT 1 FROM public.conversations c
      JOIN public.listing_inquiries li ON li.listing_id = c.listing_id
      WHERE c.id = _conversation_id
        AND li.sender_id = auth.uid()
    )
$$;

DROP POLICY IF EXISTS "Users can join own or invited conversations" ON public.conversation_participants;

CREATE POLICY "Users can join authorized conversations"
  ON public.conversation_participants FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND can_join_conversation(conversation_id)
  );
