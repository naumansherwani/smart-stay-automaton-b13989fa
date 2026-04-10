-- Block direct inserts on conversations — all inserts should go through 
-- the create_conversation_with_participant() SECURITY DEFINER function
CREATE POLICY "Block direct inserts on conversations"
ON public.conversations
AS RESTRICTIVE
FOR INSERT
TO authenticated
WITH CHECK (false);