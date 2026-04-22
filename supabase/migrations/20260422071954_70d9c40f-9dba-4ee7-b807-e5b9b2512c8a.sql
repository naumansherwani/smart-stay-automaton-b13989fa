-- Per-industry onboarding configuration (owner controlled)
CREATE TABLE public.onboarding_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  industry text NOT NULL UNIQUE,
  enabled boolean NOT NULL DEFAULT true,
  ai_tips_enabled boolean NOT NULL DEFAULT true,
  welcome_video_url text,
  default_steps jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.onboarding_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can read onboarding settings"
ON public.onboarding_settings FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can insert onboarding settings"
ON public.onboarding_settings FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update onboarding settings"
ON public.onboarding_settings FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete onboarding settings"
ON public.onboarding_settings FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER onboarding_settings_updated_at
BEFORE UPDATE ON public.onboarding_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Per-user onboarding progress
CREATE TABLE public.user_onboarding_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  industry text NOT NULL,
  language text NOT NULL DEFAULT 'en',
  current_step integer NOT NULL DEFAULT 0,
  completed_steps jsonb NOT NULL DEFAULT '[]'::jsonb,
  finished boolean NOT NULL DEFAULT false,
  finished_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_onboarding_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own onboarding progress"
ON public.user_onboarding_progress FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own onboarding progress"
ON public.user_onboarding_progress FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own onboarding progress"
ON public.user_onboarding_progress FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all onboarding progress"
ON public.user_onboarding_progress FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER user_onboarding_progress_updated_at
BEFORE UPDATE ON public.user_onboarding_progress
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_user_onboarding_user ON public.user_onboarding_progress(user_id);

-- Seed defaults for all 8 industries
INSERT INTO public.onboarding_settings (industry, enabled, ai_tips_enabled, default_steps) VALUES
('hospitality', true, true, '[
  {"key":"add_property","title":"Add your first property or tour","description":"Create a room, listing or tour package."},
  {"key":"connect_channel","title":"Connect a booking channel","description":"Link Airbnb, Booking.com or VRBO."},
  {"key":"set_pricing","title":"Set base pricing & enable Smart Pricing","description":"AI will optimize rates by demand."},
  {"key":"first_booking","title":"Create your first booking","description":"Test the full guest journey."},
  {"key":"invite_team","title":"Invite your team","description":"Add front desk or manager users."}
]'::jsonb),
('airlines', true, true, '[
  {"key":"add_aircraft","title":"Add your first aircraft","description":"Set up fleet inventory."},
  {"key":"add_route","title":"Create a flight route","description":"Define origin, destination and schedule."},
  {"key":"crew_setup","title":"Configure crew scheduling","description":"Set crew rotations and rest rules."},
  {"key":"first_flight","title":"Schedule your first flight","description":"Publish a flight for booking."}
]'::jsonb),
('car_rental', true, true, '[
  {"key":"add_vehicle","title":"Add your first vehicle","description":"List a car with daily rate."},
  {"key":"set_locations","title":"Set pickup locations","description":"Add branches or pickup points."},
  {"key":"pricing_rules","title":"Configure pricing rules","description":"Weekday vs weekend, mileage caps."},
  {"key":"first_rental","title":"Create a test rental","description":"Walk through the full flow."}
]'::jsonb),
('healthcare', true, true, '[
  {"key":"add_provider","title":"Add a doctor or provider","description":"Set specialty and availability."},
  {"key":"add_room","title":"Add a consultation room","description":"Define resource capacity."},
  {"key":"appointment_types","title":"Configure appointment types","description":"Duration and pricing per service."},
  {"key":"first_appointment","title":"Book a test appointment","description":"Verify the patient flow."}
]'::jsonb),
('education', true, true, '[
  {"key":"add_classroom","title":"Add a classroom","description":"Capacity and equipment."},
  {"key":"add_instructor","title":"Add an instructor","description":"Subjects and availability."},
  {"key":"build_timetable","title":"Build a class timetable","description":"AI suggests conflict-free slots."},
  {"key":"first_class","title":"Schedule first class","description":"Send invite to students."}
]'::jsonb),
('logistics', true, true, '[
  {"key":"add_warehouse","title":"Add a warehouse / bay","description":"Loading capacity & hours."},
  {"key":"add_driver","title":"Add a driver","description":"License & vehicle assignment."},
  {"key":"create_route","title":"Plan a delivery route","description":"AI optimizes stops."},
  {"key":"first_shipment","title":"Create first shipment","description":"Track end-to-end."}
]'::jsonb),
('events_entertainment', true, true, '[
  {"key":"add_venue","title":"Add a venue","description":"Capacity & layout."},
  {"key":"create_event","title":"Create an event","description":"Date, tickets, vendors."},
  {"key":"ticket_setup","title":"Set ticket tiers","description":"VIP / Standard pricing."},
  {"key":"first_sale","title":"Test first ticket sale","description":"Verify checkout."}
]'::jsonb),
('railways', true, true, '[
  {"key":"add_train","title":"Add a train","description":"Coaches & seat layout."},
  {"key":"add_route","title":"Define a route","description":"Stations & stop times."},
  {"key":"crew_roster","title":"Set crew roster","description":"Driver & guard rotations."},
  {"key":"first_journey","title":"Schedule a journey","description":"Publish for booking."}
]'::jsonb);