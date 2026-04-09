
CREATE TABLE public.crm_work_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  industry public.industry_type NOT NULL DEFAULT 'hospitality',
  session_type text NOT NULL DEFAULT 'work',
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  duration_seconds integer DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.crm_work_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sessions" ON public.crm_work_sessions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own sessions" ON public.crm_work_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own sessions" ON public.crm_work_sessions
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own sessions" ON public.crm_work_sessions
  FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all sessions" ON public.crm_work_sessions
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_crm_work_sessions_user ON public.crm_work_sessions(user_id, started_at DESC);
