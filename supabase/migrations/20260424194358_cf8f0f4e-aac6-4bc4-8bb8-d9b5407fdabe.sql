-- 1) Realtime channel authorization: restrict admin_alerts topic to admins
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can subscribe to non-admin topics" ON realtime.messages;
DROP POLICY IF EXISTS "Admins can subscribe to admin topics" ON realtime.messages;

-- Admins can subscribe to any topic (including admin_alerts)
CREATE POLICY "Admins can subscribe to any realtime topic"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR realtime.topic() NOT IN ('admin_alerts')
);

-- 2) Suppressed emails: add admin SELECT policy for oversight
CREATE POLICY "Admins can view suppressed emails"
ON public.suppressed_emails
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- 3) arc_actions: allow users to view their own automation action history
CREATE POLICY "Users can view their own arc_actions"
ON public.arc_actions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);
