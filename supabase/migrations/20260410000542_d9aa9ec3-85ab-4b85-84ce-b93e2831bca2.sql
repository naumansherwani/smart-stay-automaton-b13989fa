
CREATE TABLE public.crm_google_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  google_email TEXT,
  access_token_encrypted TEXT,
  refresh_token_encrypted TEXT,
  scopes TEXT[] DEFAULT '{}',
  token_expires_at TIMESTAMPTZ,
  last_sync_at TIMESTAMPTZ,
  sync_status TEXT DEFAULT 'disconnected',
  gmail_sync_enabled BOOLEAN DEFAULT false,
  calendar_sync_enabled BOOLEAN DEFAULT false,
  chat_sync_enabled BOOLEAN DEFAULT false,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.crm_google_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own google connections" ON public.crm_google_connections FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_crm_google_connections_updated_at BEFORE UPDATE ON public.crm_google_connections FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Table to cache synced emails/events
CREATE TABLE public.crm_google_synced_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  item_type TEXT NOT NULL, -- 'email', 'calendar_event', 'chat_message'
  external_id TEXT,
  title TEXT,
  body_preview TEXT,
  from_address TEXT,
  to_addresses TEXT[],
  item_date TIMESTAMPTZ,
  is_read BOOLEAN DEFAULT false,
  labels TEXT[] DEFAULT '{}',
  linked_contact_id UUID REFERENCES public.crm_contacts(id) ON DELETE SET NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, item_type, external_id)
);

ALTER TABLE public.crm_google_synced_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own synced items" ON public.crm_google_synced_items FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_google_synced_user_type ON public.crm_google_synced_items(user_id, item_type);
