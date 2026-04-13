CREATE POLICY "Users can update own workspaces"
ON public.workspaces
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);