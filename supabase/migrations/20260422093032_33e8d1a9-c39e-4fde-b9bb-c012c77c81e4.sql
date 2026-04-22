
DROP POLICY IF EXISTS "Anyone can insert checkout events" ON public.checkout_events;

CREATE POLICY "Insert own or anonymous checkout events"
  ON public.checkout_events FOR INSERT
  WITH CHECK (
    user_id IS NULL OR user_id = auth.uid()
  );
