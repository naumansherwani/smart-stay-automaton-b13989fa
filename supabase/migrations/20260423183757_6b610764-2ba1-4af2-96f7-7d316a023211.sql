ALTER PUBLICATION supabase_realtime DROP TABLE public.payment_refunds;

CREATE POLICY "Users can insert own activity logs"
  ON public.crm_activity_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone can submit enterprise leads" ON public.enterprise_leads;
CREATE POLICY "Anyone can submit enterprise leads"
  ON public.enterprise_leads
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    full_name IS NOT NULL AND length(btrim(full_name)) > 0
    AND work_email IS NOT NULL AND work_email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
  );

DROP POLICY IF EXISTS "Anyone can join waitlist" ON public.payment_waitlist;
CREATE POLICY "Anyone can join waitlist"
  ON public.payment_waitlist
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    email IS NOT NULL AND email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
  );