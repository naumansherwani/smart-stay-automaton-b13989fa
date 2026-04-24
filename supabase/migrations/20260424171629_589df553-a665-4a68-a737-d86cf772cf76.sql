-- Founder AI Conversations (chat threads)
CREATE TABLE public.founder_ai_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL DEFAULT 'New conversation',
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  message_count INTEGER NOT NULL DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_founder_conv_user_recent ON public.founder_ai_conversations (user_id, is_archived, last_message_at DESC);
CREATE INDEX idx_founder_conv_pinned ON public.founder_ai_conversations (user_id, is_pinned) WHERE is_pinned = true;
CREATE INDEX idx_founder_conv_title_search ON public.founder_ai_conversations USING gin (to_tsvector('english', title));

ALTER TABLE public.founder_ai_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view own founder conversations"
  ON public.founder_ai_conversations FOR SELECT
  USING (auth.uid() = user_id AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins create own founder conversations"
  ON public.founder_ai_conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update own founder conversations"
  ON public.founder_ai_conversations FOR UPDATE
  USING (auth.uid() = user_id AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete own founder conversations"
  ON public.founder_ai_conversations FOR DELETE
  USING (auth.uid() = user_id AND public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_founder_conv_updated
  BEFORE UPDATE ON public.founder_ai_conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Founder AI Messages
CREATE TABLE public.founder_ai_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.founder_ai_conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user','assistant','system')),
  content TEXT NOT NULL DEFAULT '',
  attachments JSONB DEFAULT '[]'::jsonb,
  model TEXT,
  token_count INTEGER,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_founder_msg_conv ON public.founder_ai_messages (conversation_id, created_at);
CREATE INDEX idx_founder_msg_user_recent ON public.founder_ai_messages (user_id, created_at DESC);
CREATE INDEX idx_founder_msg_content_search ON public.founder_ai_messages USING gin (to_tsvector('english', content));

ALTER TABLE public.founder_ai_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view own founder messages"
  ON public.founder_ai_messages FOR SELECT
  USING (auth.uid() = user_id AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins create own founder messages"
  ON public.founder_ai_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete own founder messages"
  ON public.founder_ai_messages FOR DELETE
  USING (auth.uid() = user_id AND public.has_role(auth.uid(), 'admin'));

-- Auto-update conversation last_message_at + count on new message
CREATE OR REPLACE FUNCTION public.bump_founder_conversation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.founder_ai_conversations
  SET last_message_at = NEW.created_at,
      message_count = message_count + 1,
      updated_at = now()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_bump_founder_conv
  AFTER INSERT ON public.founder_ai_messages
  FOR EACH ROW EXECUTE FUNCTION public.bump_founder_conversation();

-- Storage bucket for screenshot/image uploads (private, owner-only)
INSERT INTO storage.buckets (id, name, public)
VALUES ('founder-ai-uploads', 'founder-ai-uploads', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Admins read own founder uploads"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'founder-ai-uploads'
         AND auth.uid()::text = (storage.foldername(name))[1]
         AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins upload own founder uploads"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'founder-ai-uploads'
              AND auth.uid()::text = (storage.foldername(name))[1]
              AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete own founder uploads"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'founder-ai-uploads'
         AND auth.uid()::text = (storage.foldername(name))[1]
         AND public.has_role(auth.uid(), 'admin'));