
-- Fix 1: crm_google_connections — hide encrypted tokens from clients
DROP POLICY IF EXISTS "Users manage own google connections" ON public.crm_google_connections;

CREATE POLICY "Users insert own google connections"
  ON public.crm_google_connections FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own google connections"
  ON public.crm_google_connections FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own google connections"
  ON public.crm_google_connections FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role reads google connections"
  ON public.crm_google_connections FOR SELECT
  TO service_role
  USING (true);

-- Fix 2: realtime.messages — scope broadcast/presence to user-owned topics,
-- keep postgres_changes working (its delivery is filtered by source-table RLS).
DROP POLICY IF EXISTS "Admins can subscribe to any realtime topic" ON realtime.messages;

CREATE POLICY "Scoped realtime subscriptions"
  ON realtime.messages FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR realtime.messages.extension = 'postgres_changes'
    OR (
      realtime.messages.extension IN ('broadcast', 'presence')
      AND realtime.topic() LIKE 'user:' || auth.uid()::text || '%'
    )
  );
