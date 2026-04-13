
CREATE TABLE public.booking_conflicts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  resource_id UUID REFERENCES public.resources(id) ON DELETE SET NULL,
  resource_name TEXT NOT NULL,
  existing_client TEXT NOT NULL,
  new_client TEXT NOT NULL,
  new_client_email TEXT,
  existing_time_start TIMESTAMPTZ NOT NULL,
  existing_time_end TIMESTAMPTZ NOT NULL,
  new_time_start TIMESTAMPTZ NOT NULL,
  new_time_end TIMESTAMPTZ NOT NULL,
  conflict_type TEXT NOT NULL DEFAULT 'overlap',
  resolution TEXT NOT NULL DEFAULT 'auto-declined',
  resolved_resource_id UUID REFERENCES public.resources(id) ON DELETE SET NULL,
  resolved_resource_name TEXT,
  suggested_slot_start TIMESTAMPTZ,
  suggested_slot_end TIMESTAMPTZ,
  industry TEXT NOT NULL DEFAULT 'hospitality',
  email_sent BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.booking_conflicts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own conflicts" ON public.booking_conflicts
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own conflicts" ON public.booking_conflicts
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conflicts" ON public.booking_conflicts
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX idx_booking_conflicts_user_created ON public.booking_conflicts(user_id, created_at DESC);
