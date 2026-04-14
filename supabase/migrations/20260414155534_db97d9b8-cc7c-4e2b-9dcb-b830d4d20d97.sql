
-- Healthcare Doctors
CREATE TABLE public.healthcare_doctors (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  name text NOT NULL,
  specialization text NOT NULL DEFAULT 'General Medicine',
  status text NOT NULL DEFAULT 'available',
  room text,
  patients_today integer NOT NULL DEFAULT 0,
  max_patients integer NOT NULL DEFAULT 20,
  next_available text,
  rating numeric DEFAULT 0,
  working_hours text DEFAULT '09:00–17:00',
  working_days text DEFAULT 'Mon–Sat',
  slot_duration integer DEFAULT 30,
  phone text,
  avatar text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.healthcare_doctors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own doctors" ON public.healthcare_doctors FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all doctors" ON public.healthcare_doctors FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can insert own doctors" ON public.healthcare_doctors FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own doctors" ON public.healthcare_doctors FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own doctors" ON public.healthcare_doctors FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_healthcare_doctors_updated_at BEFORE UPDATE ON public.healthcare_doctors FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Healthcare Patients
CREATE TABLE public.healthcare_patients (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  name text NOT NULL,
  age integer,
  gender text,
  phone text,
  email text,
  condition text,
  doctor_id uuid REFERENCES public.healthcare_doctors(id) ON DELETE SET NULL,
  doctor_name text,
  total_visits integer NOT NULL DEFAULT 0,
  no_show_count integer NOT NULL DEFAULT 0,
  last_visit_at timestamptz,
  upcoming_appointment_at timestamptz,
  status text NOT NULL DEFAULT 'new',
  notes text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.healthcare_patients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own patients" ON public.healthcare_patients FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all patients" ON public.healthcare_patients FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can insert own patients" ON public.healthcare_patients FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own patients" ON public.healthcare_patients FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own patients" ON public.healthcare_patients FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_healthcare_patients_updated_at BEFORE UPDATE ON public.healthcare_patients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Healthcare Appointments
CREATE TABLE public.healthcare_appointments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  patient_id uuid REFERENCES public.healthcare_patients(id) ON DELETE CASCADE,
  patient_name text NOT NULL,
  patient_phone text,
  doctor_id uuid REFERENCES public.healthcare_doctors(id) ON DELETE CASCADE,
  doctor_name text NOT NULL,
  specialization text,
  appointment_time timestamptz NOT NULL,
  duration_minutes integer NOT NULL DEFAULT 30,
  type text NOT NULL DEFAULT 'consultation',
  status text NOT NULL DEFAULT 'scheduled',
  fee numeric DEFAULT 0,
  notes text,
  no_show_risk integer DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.healthcare_appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own appointments" ON public.healthcare_appointments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all appointments" ON public.healthcare_appointments FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can insert own appointments" ON public.healthcare_appointments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own appointments" ON public.healthcare_appointments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own appointments" ON public.healthcare_appointments FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_healthcare_appointments_updated_at BEFORE UPDATE ON public.healthcare_appointments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
