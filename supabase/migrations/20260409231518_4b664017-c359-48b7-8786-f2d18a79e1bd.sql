
-- =============================================
-- CRM CONTACTS TABLE
-- =============================================
CREATE TABLE public.crm_contacts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  industry public.industry_type NOT NULL DEFAULT 'hospitality',
  
  -- Contact info
  name text NOT NULL,
  email text,
  phone text,
  company text,
  avatar_url text,
  address text,
  
  -- CRM fields
  lifecycle_stage text NOT NULL DEFAULT 'lead',
  source text DEFAULT 'direct',
  tags text[] DEFAULT '{}',
  ai_score integer DEFAULT 0,
  ai_score_reason text,
  
  -- Engagement
  last_contacted_at timestamptz,
  total_bookings integer DEFAULT 0,
  total_revenue numeric DEFAULT 0,
  churn_risk text DEFAULT 'low',
  
  -- Notes
  notes text,
  metadata jsonb DEFAULT '{}',
  
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.crm_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own contacts" ON public.crm_contacts
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own contacts" ON public.crm_contacts
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own contacts" ON public.crm_contacts
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own contacts" ON public.crm_contacts
  FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all contacts" ON public.crm_contacts
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_crm_contacts_user_industry ON public.crm_contacts(user_id, industry);
CREATE INDEX idx_crm_contacts_lifecycle ON public.crm_contacts(user_id, lifecycle_stage);
CREATE INDEX idx_crm_contacts_ai_score ON public.crm_contacts(user_id, ai_score DESC);

CREATE TRIGGER update_crm_contacts_updated_at
  BEFORE UPDATE ON public.crm_contacts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- CRM TICKETS TABLE
-- =============================================
CREATE TABLE public.crm_tickets (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  industry public.industry_type NOT NULL DEFAULT 'hospitality',
  contact_id uuid REFERENCES public.crm_contacts(id) ON DELETE SET NULL,
  
  -- Ticket info
  ticket_number text NOT NULL DEFAULT upper(substr(md5(random()::text), 1, 8)),
  subject text NOT NULL,
  description text,
  category text DEFAULT 'general',
  
  -- Status & Priority
  status text NOT NULL DEFAULT 'open',
  priority text NOT NULL DEFAULT 'medium',
  
  -- Assignment
  assigned_to text,
  
  -- AI fields
  ai_summary text,
  ai_suggested_resolution text,
  ai_category text,
  ai_sentiment text DEFAULT 'neutral',
  
  -- Resolution
  resolution_notes text,
  resolved_at timestamptz,
  sla_deadline timestamptz,
  
  -- Source
  source text DEFAULT 'manual',
  
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.crm_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tickets" ON public.crm_tickets
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own tickets" ON public.crm_tickets
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tickets" ON public.crm_tickets
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own tickets" ON public.crm_tickets
  FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all tickets" ON public.crm_tickets
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_crm_tickets_user_industry ON public.crm_tickets(user_id, industry);
CREATE INDEX idx_crm_tickets_status ON public.crm_tickets(user_id, status);
CREATE INDEX idx_crm_tickets_priority ON public.crm_tickets(user_id, priority);

CREATE TRIGGER update_crm_tickets_updated_at
  BEFORE UPDATE ON public.crm_tickets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- CRM PIPELINES TABLE
-- =============================================
CREATE TABLE public.crm_pipelines (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  industry public.industry_type NOT NULL DEFAULT 'hospitality',
  
  name text NOT NULL,
  stages jsonb NOT NULL DEFAULT '[{"name":"Lead","order":1},{"name":"Qualified","order":2},{"name":"Proposal","order":3},{"name":"Negotiation","order":4},{"name":"Won","order":5},{"name":"Lost","order":6}]',
  is_default boolean DEFAULT false,
  color text DEFAULT 'hsl(168, 70%, 38%)',
  
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.crm_pipelines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own pipelines" ON public.crm_pipelines
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own pipelines" ON public.crm_pipelines
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own pipelines" ON public.crm_pipelines
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own pipelines" ON public.crm_pipelines
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_crm_pipelines_user_industry ON public.crm_pipelines(user_id, industry);

CREATE TRIGGER update_crm_pipelines_updated_at
  BEFORE UPDATE ON public.crm_pipelines
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- CRM DEALS TABLE
-- =============================================
CREATE TABLE public.crm_deals (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  industry public.industry_type NOT NULL DEFAULT 'hospitality',
  contact_id uuid REFERENCES public.crm_contacts(id) ON DELETE SET NULL,
  pipeline_id uuid REFERENCES public.crm_pipelines(id) ON DELETE CASCADE,
  
  title text NOT NULL,
  value numeric DEFAULT 0,
  currency text DEFAULT 'USD',
  probability integer DEFAULT 0,
  stage text NOT NULL DEFAULT 'Lead',
  
  expected_close_date date,
  won_at timestamptz,
  lost_at timestamptz,
  lost_reason text,
  
  notes text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.crm_deals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own deals" ON public.crm_deals
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own deals" ON public.crm_deals
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own deals" ON public.crm_deals
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own deals" ON public.crm_deals
  FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all deals" ON public.crm_deals
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_crm_deals_user_industry ON public.crm_deals(user_id, industry);
CREATE INDEX idx_crm_deals_stage ON public.crm_deals(user_id, stage);
CREATE INDEX idx_crm_deals_pipeline ON public.crm_deals(pipeline_id);

CREATE TRIGGER update_crm_deals_updated_at
  BEFORE UPDATE ON public.crm_deals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- CRM ACTIVITIES TABLE
-- =============================================
CREATE TABLE public.crm_activities (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  industry public.industry_type NOT NULL DEFAULT 'hospitality',
  
  -- References (all optional, at least one should be set)
  contact_id uuid REFERENCES public.crm_contacts(id) ON DELETE CASCADE,
  deal_id uuid REFERENCES public.crm_deals(id) ON DELETE CASCADE,
  ticket_id uuid REFERENCES public.crm_tickets(id) ON DELETE CASCADE,
  
  -- Activity details
  type text NOT NULL DEFAULT 'note',
  subject text,
  description text,
  
  -- Scheduling
  scheduled_at timestamptz,
  completed_at timestamptz,
  is_completed boolean DEFAULT false,
  
  -- AI
  ai_generated boolean DEFAULT false,
  
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.crm_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own activities" ON public.crm_activities
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own activities" ON public.crm_activities
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own activities" ON public.crm_activities
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own activities" ON public.crm_activities
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_crm_activities_user ON public.crm_activities(user_id);
CREATE INDEX idx_crm_activities_contact ON public.crm_activities(contact_id);
CREATE INDEX idx_crm_activities_type ON public.crm_activities(user_id, type);

CREATE TRIGGER update_crm_activities_updated_at
  BEFORE UPDATE ON public.crm_activities
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- CRM AUTOMATIONS TABLE
-- =============================================
CREATE TABLE public.crm_automations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  industry public.industry_type NOT NULL DEFAULT 'hospitality',
  
  name text NOT NULL,
  description text,
  trigger_type text NOT NULL DEFAULT 'manual',
  conditions jsonb DEFAULT '{}',
  actions jsonb DEFAULT '{}',
  
  is_active boolean DEFAULT true,
  last_triggered_at timestamptz,
  trigger_count integer DEFAULT 0,
  
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.crm_automations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own automations" ON public.crm_automations
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own automations" ON public.crm_automations
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own automations" ON public.crm_automations
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own automations" ON public.crm_automations
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_crm_automations_user_industry ON public.crm_automations(user_id, industry);

CREATE TRIGGER update_crm_automations_updated_at
  BEFORE UPDATE ON public.crm_automations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
