
CREATE TABLE IF NOT EXISTS public.owner_scheduled_emails (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  to_addr TEXT NOT NULL,
  cc TEXT,
  bcc TEXT,
  subject TEXT NOT NULL,
  html TEXT NOT NULL,
  in_reply_to TEXT,
  ref_headers TEXT,
  send_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  sent_at TIMESTAMPTZ,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_owner_sched_due ON public.owner_scheduled_emails (status, send_at);

ALTER TABLE public.owner_scheduled_emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage scheduled emails"
ON public.owner_scheduled_emails
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_owner_sched_updated
BEFORE UPDATE ON public.owner_scheduled_emails
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
