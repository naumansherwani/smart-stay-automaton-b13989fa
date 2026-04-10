
-- CRM Tasks table for Smart Task Auto-Organizer
CREATE TABLE public.crm_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  industry public.industry_type NOT NULL DEFAULT 'hospitality',
  title TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'general',
  priority TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'pending',
  due_date DATE,
  scheduled_time TIMESTAMPTZ,
  estimated_minutes INT,
  completed_at TIMESTAMPTZ,
  linked_contact_id UUID REFERENCES public.crm_contacts(id) ON DELETE SET NULL,
  linked_deal_id UUID REFERENCES public.crm_deals(id) ON DELETE SET NULL,
  linked_ticket_id UUID REFERENCES public.crm_tickets(id) ON DELETE SET NULL,
  ai_priority_score NUMERIC(3,1),
  ai_category TEXT,
  ai_suggestions JSONB DEFAULT '[]'::jsonb,
  recurrence_rule TEXT,
  is_recurring BOOLEAN DEFAULT false,
  sort_order INT DEFAULT 0,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.crm_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own tasks" ON public.crm_tasks FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_crm_tasks_user_status ON public.crm_tasks(user_id, status);
CREATE INDEX idx_crm_tasks_due_date ON public.crm_tasks(user_id, due_date);

CREATE TRIGGER update_crm_tasks_updated_at BEFORE UPDATE ON public.crm_tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- CRM Daily Plans table for AI Daily Planner
CREATE TABLE public.crm_daily_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  industry public.industry_type NOT NULL DEFAULT 'hospitality',
  plan_date DATE NOT NULL,
  tasks_summary JSONB DEFAULT '[]'::jsonb,
  ai_recommendations JSONB DEFAULT '[]'::jsonb,
  focus_areas TEXT[] DEFAULT '{}',
  productivity_score NUMERIC(3,1),
  mood TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, plan_date)
);

ALTER TABLE public.crm_daily_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own daily plans" ON public.crm_daily_plans FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_crm_daily_plans_updated_at BEFORE UPDATE ON public.crm_daily_plans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
