import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export interface HcDoctor {
  id: string;
  name: string;
  specialization: string;
  status: string;
  room: string | null;
  patients_today: number;
  max_patients: number;
  next_available: string | null;
  rating: number;
  working_hours: string | null;
  working_days: string | null;
  slot_duration: number;
  phone: string | null;
  avatar: string | null;
}

export interface HcPatient {
  id: string;
  name: string;
  age: number | null;
  gender: string | null;
  phone: string | null;
  email: string | null;
  condition: string | null;
  doctor_id: string | null;
  doctor_name: string | null;
  total_visits: number;
  no_show_count: number;
  last_visit_at: string | null;
  upcoming_appointment_at: string | null;
  status: string;
}

export interface HcAppointment {
  id: string;
  patient_id: string | null;
  patient_name: string;
  patient_phone: string | null;
  doctor_id: string | null;
  doctor_name: string;
  specialization: string | null;
  appointment_time: string;
  duration_minutes: number;
  type: string;
  status: string;
  fee: number;
  notes: string | null;
  no_show_risk: number;
}

export function useHealthcare() {
  const { user } = useAuth();
  const [doctors, setDoctors] = useState<HcDoctor[]>([]);
  const [patients, setPatients] = useState<HcPatient[]>([]);
  const [appointments, setAppointments] = useState<HcAppointment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [d, p, a] = await Promise.all([
      supabase.from("healthcare_doctors").select("*").eq("user_id", user.id).order("name"),
      supabase.from("healthcare_patients").select("*").eq("user_id", user.id).order("name"),
      supabase.from("healthcare_appointments").select("*").eq("user_id", user.id).order("appointment_time", { ascending: true }),
    ]);
    setDoctors((d.data as HcDoctor[]) || []);
    setPatients((p.data as HcPatient[]) || []);
    setAppointments((a.data as HcAppointment[]) || []);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Doctors CRUD ──
  const addDoctor = async (doc: Partial<HcDoctor>) => {
    if (!user) return;
    const { error } = await supabase.from("healthcare_doctors").insert({ ...doc, user_id: user.id } as any);
    if (error) { toast.error("Failed to add doctor"); return; }
    toast.success("Doctor added");
    fetchAll();
  };

  const updateDoctor = async (id: string, updates: Partial<HcDoctor>) => {
    const { error } = await supabase.from("healthcare_doctors").update(updates as any).eq("id", id);
    if (error) { toast.error("Failed to update doctor"); return; }
    toast.success("Doctor updated");
    fetchAll();
  };

  const deleteDoctor = async (id: string) => {
    const { error } = await supabase.from("healthcare_doctors").delete().eq("id", id);
    if (error) { toast.error("Failed to delete doctor"); return; }
    toast.success("Doctor removed");
    fetchAll();
  };

  // ── Patients CRUD ──
  const addPatient = async (pat: Partial<HcPatient>) => {
    if (!user) return;
    const { error } = await supabase.from("healthcare_patients").insert({ ...pat, user_id: user.id } as any);
    if (error) { toast.error("Failed to add patient"); return; }
    toast.success("Patient added");
    fetchAll();
  };

  const updatePatient = async (id: string, updates: Partial<HcPatient>) => {
    const { error } = await supabase.from("healthcare_patients").update(updates as any).eq("id", id);
    if (error) { toast.error("Failed to update patient"); return; }
    toast.success("Patient updated");
    fetchAll();
  };

  const deletePatient = async (id: string) => {
    const { error } = await supabase.from("healthcare_patients").delete().eq("id", id);
    if (error) { toast.error("Failed to delete patient"); return; }
    toast.success("Patient removed");
    fetchAll();
  };

  // ── Appointments CRUD ──
  const addAppointment = async (apt: Partial<HcAppointment>) => {
    if (!user) return;
    const { error } = await supabase.from("healthcare_appointments").insert({ ...apt, user_id: user.id } as any);
    if (error) { toast.error("Failed to book appointment"); return; }
    toast.success("Appointment booked");
    fetchAll();
  };

  const updateAppointment = async (id: string, updates: Partial<HcAppointment>) => {
    const { error } = await supabase.from("healthcare_appointments").update(updates as any).eq("id", id);
    if (error) { toast.error("Failed to update appointment"); return; }
    toast.success("Appointment updated");
    fetchAll();
  };

  const deleteAppointment = async (id: string) => {
    const { error } = await supabase.from("healthcare_appointments").delete().eq("id", id);
    if (error) { toast.error("Failed to delete appointment"); return; }
    toast.success("Appointment removed");
    fetchAll();
  };

  return {
    doctors, patients, appointments, loading, refetch: fetchAll,
    addDoctor, updateDoctor, deleteDoctor,
    addPatient, updatePatient, deletePatient,
    addAppointment, updateAppointment, deleteAppointment,
  };
}
