CREATE TABLE public.crm_performance_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  industry TEXT NOT NULL DEFAULT 'hospitality',
  report_month DATE NOT NULL,
  total_work_seconds INTEGER NOT NULL DEFAULT 0,
  total_break_seconds INTEGER NOT NULL DEFAULT 0,
  total_sessions INTEGER NOT NULL DEFAULT 0,
  total_breaks INTEGER NOT NULL DEFAULT 0,
  avg_session_minutes NUMERIC DEFAULT 0,
  longest_session_minutes NUMERIC DEFAULT 0,
  days_active INTEGER DEFAULT 0,
  productivity_score NUMERIC DEFAULT 0,
  ai_summary TEXT,
  ai_recommendations JSONB DEFAULT '[]'::jsonb,
  is_read BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, report_month, industry)
);

ALTER TABLE public.crm_performance_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reports"
  ON public.crm_performance_reports FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reports"
  ON public.crm_performance_reports FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reports"
  ON public.crm_performance_reports FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER update_crm_performance_reports_updated_at
  BEFORE UPDATE ON public.crm_performance_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();