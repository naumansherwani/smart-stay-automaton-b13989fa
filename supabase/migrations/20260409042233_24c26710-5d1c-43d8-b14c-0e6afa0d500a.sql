
-- Schedule settings per resource
CREATE TABLE public.schedule_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  resource_id UUID REFERENCES public.resources(id) ON DELETE CASCADE NOT NULL,
  working_days INTEGER[] NOT NULL DEFAULT '{1,2,3,4,5}',
  working_hours_start TIME NOT NULL DEFAULT '09:00',
  working_hours_end TIME NOT NULL DEFAULT '17:00',
  slot_duration_minutes INTEGER NOT NULL DEFAULT 60,
  buffer_minutes INTEGER NOT NULL DEFAULT 15,
  max_capacity INTEGER NOT NULL DEFAULT 1,
  holidays TEXT[] NOT NULL DEFAULT '{}',
  timezone TEXT NOT NULL DEFAULT 'UTC',
  overbooking_allowed BOOLEAN NOT NULL DEFAULT false,
  overbooking_limit INTEGER NOT NULL DEFAULT 0,
  auto_confirm BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(resource_id)
);

ALTER TABLE public.schedule_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own schedule settings"
  ON public.schedule_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own schedule settings"
  ON public.schedule_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own schedule settings"
  ON public.schedule_settings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own schedule settings"
  ON public.schedule_settings FOR DELETE
  USING (auth.uid() = user_id);

CREATE TRIGGER update_schedule_settings_updated_at
  BEFORE UPDATE ON public.schedule_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add resource assignment support to bookings
ALTER TABLE public.bookings 
  ADD COLUMN IF NOT EXISTS assigned_staff TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS assigned_room TEXT,
  ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC',
  ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS rescheduled_from UUID REFERENCES public.bookings(id);

-- Enable realtime for bookings
ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.schedule_settings;
