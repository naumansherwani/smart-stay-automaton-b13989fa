
-- Conflict resolution policy (one row per user, with hard-locked defaults)
CREATE TABLE IF NOT EXISTS public.scheduling_conflict_policy (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  -- Locked priority order (1 = highest). Editable labels but order is enforced server-side.
  priority_order jsonb NOT NULL DEFAULT '["manual_override","confirmed_booking","google_calendar","ai_confirmed","ai_suggestion"]'::jsonb,
  -- Behavior knobs
  google_calendar_wins_over_ai boolean NOT NULL DEFAULT true,
  auto_reschedule_ai_on_conflict boolean NOT NULL DEFAULT true,
  notify_on_resolution boolean NOT NULL DEFAULT true,
  buffer_minutes integer NOT NULL DEFAULT 15,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.scheduling_conflict_policy ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own policy" ON public.scheduling_conflict_policy
  FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users insert own policy" ON public.scheduling_conflict_policy
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own policy" ON public.scheduling_conflict_policy
  FOR UPDATE USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete" ON public.scheduling_conflict_policy
  FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_scp_updated_at BEFORE UPDATE ON public.scheduling_conflict_policy
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Audit log of every conflict resolution decision
CREATE TABLE IF NOT EXISTS public.scheduling_conflict_resolutions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  source_a text NOT NULL,            -- e.g. 'google_calendar'
  source_b text NOT NULL,            -- e.g. 'ai_suggestion'
  winner text NOT NULL,              -- which source won
  reason text NOT NULL,              -- human-readable rule applied
  conflict_start timestamptz NOT NULL,
  conflict_end timestamptz NOT NULL,
  resolution_action text NOT NULL,   -- 'kept_winner' | 'rescheduled_loser' | 'cancelled_loser'
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.scheduling_conflict_resolutions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own resolutions" ON public.scheduling_conflict_resolutions
  FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Service inserts resolutions" ON public.scheduling_conflict_resolutions
  FOR INSERT WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_scr_user_created ON public.scheduling_conflict_resolutions(user_id, created_at DESC);
