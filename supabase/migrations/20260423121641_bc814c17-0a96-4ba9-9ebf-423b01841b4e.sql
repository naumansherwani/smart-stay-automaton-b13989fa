
CREATE TABLE public.enterprise_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  company_name text NOT NULL,
  work_email text NOT NULL,
  phone text,
  industry text,
  team_size text,
  country text,
  current_challenges text,
  features_needed text,
  preferred_contact_method text,
  source text NOT NULL DEFAULT 'Website Enterprise Pricing Page',
  status text NOT NULL DEFAULT 'new',
  currency_context text NOT NULL DEFAULT 'GBP',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.enterprise_leads ENABLE ROW LEVEL SECURITY;

-- Anyone (including anon) can submit a lead
CREATE POLICY "Anyone can submit enterprise leads"
ON public.enterprise_leads
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Only admins can view leads
CREATE POLICY "Admins can view enterprise leads"
ON public.enterprise_leads
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can update leads (status changes, notes)
CREATE POLICY "Admins can update enterprise leads"
ON public.enterprise_leads
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Only admins can delete leads
CREATE POLICY "Admins can delete enterprise leads"
ON public.enterprise_leads
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_enterprise_leads_created_at ON public.enterprise_leads (created_at DESC);
CREATE INDEX idx_enterprise_leads_status ON public.enterprise_leads (status);

CREATE TRIGGER update_enterprise_leads_updated_at
BEFORE UPDATE ON public.enterprise_leads
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
