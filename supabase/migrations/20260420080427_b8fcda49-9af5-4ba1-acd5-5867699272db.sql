
CREATE TABLE public.payment_waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  plan text,
  source text DEFAULT 'pricing_banner',
  notified boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX payment_waitlist_email_idx ON public.payment_waitlist (lower(email));

ALTER TABLE public.payment_waitlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can join waitlist"
  ON public.payment_waitlist FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view waitlist"
  ON public.payment_waitlist FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));
