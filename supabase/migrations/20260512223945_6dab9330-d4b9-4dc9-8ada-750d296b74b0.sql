CREATE POLICY "ai_usage_logs user insert own"
ON public.ai_usage_logs
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "ai_usage_logs user read own"
ON public.ai_usage_logs
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);