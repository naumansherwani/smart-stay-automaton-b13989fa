-- Advisor threads: one active per (user_id, industry)
CREATE TABLE public.advisor_threads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  industry TEXT NOT NULL,
  title TEXT,
  draft TEXT DEFAULT '',
  scroll_position INTEGER DEFAULT 0,
  window_state TEXT NOT NULL DEFAULT 'closed', -- closed | open | minimized | maximized
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_advisor_threads_user_industry ON public.advisor_threads (user_id, industry, last_message_at DESC);

ALTER TABLE public.advisor_threads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users select own threads" ON public.advisor_threads
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own threads" ON public.advisor_threads
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own threads" ON public.advisor_threads
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own threads" ON public.advisor_threads
  FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER trg_advisor_threads_updated
  BEFORE UPDATE ON public.advisor_threads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Advisor messages
CREATE TABLE public.advisor_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  thread_id UUID NOT NULL REFERENCES public.advisor_threads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user','assistant','system')),
  content TEXT NOT NULL DEFAULT '',
  tool_events JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_advisor_messages_thread_created ON public.advisor_messages (thread_id, created_at DESC);
CREATE INDEX idx_advisor_messages_user ON public.advisor_messages (user_id);

ALTER TABLE public.advisor_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users select own messages" ON public.advisor_messages
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own messages" ON public.advisor_messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own messages" ON public.advisor_messages
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own messages" ON public.advisor_messages
  FOR DELETE USING (auth.uid() = user_id);