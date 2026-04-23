-- Phase 4B: Internal Enterprise Sales CRM (admin-only, fully separate from user CRM)

-- Extend enterprise_leads with pipeline fields
ALTER TABLE public.enterprise_leads
  ADD COLUMN IF NOT EXISTS assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS estimated_value_gbp numeric(12,2),
  ADD COLUMN IF NOT EXISTS company_id uuid;

-- Backfill statuses to richer pipeline (keeps existing values valid)
-- existing statuses: new/contacted/qualified/won/lost — we now also allow demo/proposal/negotiation

-- =========== ent_companies ===========
CREATE TABLE IF NOT EXISTS public.ent_companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  website text,
  industry text,
  country text,
  team_size text,
  annual_revenue_band text,
  notes text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ent_companies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage ent_companies" ON public.ent_companies
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_ent_companies_updated BEFORE UPDATE ON public.ent_companies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========== ent_deals ===========
CREATE TABLE IF NOT EXISTS public.ent_deals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  lead_id uuid REFERENCES public.enterprise_leads(id) ON DELETE SET NULL,
  company_id uuid REFERENCES public.ent_companies(id) ON DELETE SET NULL,
  stage text NOT NULL DEFAULT 'new' CHECK (stage IN ('new','contacted','qualified','demo','proposal','negotiation','won','lost')),
  value_gbp numeric(12,2) NOT NULL DEFAULT 0,
  probability int NOT NULL DEFAULT 10 CHECK (probability BETWEEN 0 AND 100),
  expected_close_date date,
  owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ent_deals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage ent_deals" ON public.ent_deals
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_ent_deals_updated BEFORE UPDATE ON public.ent_deals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX IF NOT EXISTS idx_ent_deals_stage ON public.ent_deals(stage);

-- =========== ent_tasks ===========
CREATE TABLE IF NOT EXISTS public.ent_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  lead_id uuid REFERENCES public.enterprise_leads(id) ON DELETE CASCADE,
  deal_id uuid REFERENCES public.ent_deals(id) ON DELETE CASCADE,
  due_date timestamptz,
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high','urgent')),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_progress','done','canceled')),
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ent_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage ent_tasks" ON public.ent_tasks
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_ent_tasks_updated BEFORE UPDATE ON public.ent_tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX IF NOT EXISTS idx_ent_tasks_status ON public.ent_tasks(status);

-- =========== ent_notes ===========
CREATE TABLE IF NOT EXISTS public.ent_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  body text NOT NULL,
  lead_id uuid REFERENCES public.enterprise_leads(id) ON DELETE CASCADE,
  deal_id uuid REFERENCES public.ent_deals(id) ON DELETE CASCADE,
  company_id uuid REFERENCES public.ent_companies(id) ON DELETE CASCADE,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ent_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage ent_notes" ON public.ent_notes
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- FK from enterprise_leads.company_id (added above) to ent_companies
ALTER TABLE public.enterprise_leads
  DROP CONSTRAINT IF EXISTS enterprise_leads_company_id_fkey;
ALTER TABLE public.enterprise_leads
  ADD CONSTRAINT enterprise_leads_company_id_fkey
  FOREIGN KEY (company_id) REFERENCES public.ent_companies(id) ON DELETE SET NULL;