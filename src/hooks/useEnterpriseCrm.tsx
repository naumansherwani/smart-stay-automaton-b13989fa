import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export type DealStage =
  | "new" | "contacted" | "qualified" | "demo"
  | "proposal" | "negotiation" | "won" | "lost";

export const DEAL_STAGES: DealStage[] = [
  "new", "contacted", "qualified", "demo",
  "proposal", "negotiation", "won", "lost",
];

export const STAGE_COLORS: Record<DealStage, string> = {
  new: "bg-slate-500/15 text-slate-300 border-slate-500/30",
  contacted: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  qualified: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  demo: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
  proposal: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  negotiation: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  won: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  lost: "bg-red-500/15 text-red-400 border-red-500/30",
};

export interface EntLead {
  id: string;
  full_name: string;
  company_name: string;
  work_email: string;
  phone: string | null;
  industry: string | null;
  team_size: string | null;
  country: string | null;
  current_challenges: string | null;
  features_needed: string | null;
  preferred_contact_method: string | null;
  status: string;
  source: string;
  estimated_value_gbp: number | null;
  company_id: string | null;
  created_at: string;
}

export interface EntCompany {
  id: string;
  name: string;
  website: string | null;
  industry: string | null;
  country: string | null;
  team_size: string | null;
  annual_revenue_band: string | null;
  notes: string | null;
  created_at: string;
}

export interface EntDeal {
  id: string;
  title: string;
  lead_id: string | null;
  company_id: string | null;
  stage: DealStage;
  value_gbp: number;
  probability: number;
  expected_close_date: string | null;
  notes: string | null;
  created_at: string;
}

export interface EntTask {
  id: string;
  title: string;
  description: string | null;
  lead_id: string | null;
  deal_id: string | null;
  due_date: string | null;
  priority: "low" | "medium" | "high" | "urgent";
  status: "open" | "in_progress" | "done" | "canceled";
  created_at: string;
}

export interface EntNote {
  id: string;
  body: string;
  lead_id: string | null;
  deal_id: string | null;
  company_id: string | null;
  created_at: string;
}

export function useEntLeads() {
  const [data, setData] = useState<EntLead[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    setLoading(true);
    const { data: rows } = await supabase
      .from("enterprise_leads")
      .select("*")
      .order("created_at", { ascending: false });
    setData((rows || []) as EntLead[]);
    setLoading(false);
  }, []);

  useEffect(() => { refetch(); }, [refetch]);
  return { data, loading, refetch };
}

export function useEntCompanies() {
  const [data, setData] = useState<EntCompany[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    setLoading(true);
    const { data: rows } = await supabase
      .from("ent_companies")
      .select("*")
      .order("created_at", { ascending: false });
    setData((rows || []) as EntCompany[]);
    setLoading(false);
  }, []);

  useEffect(() => { refetch(); }, [refetch]);
  return { data, loading, refetch };
}

export function useEntDeals() {
  const [data, setData] = useState<EntDeal[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    setLoading(true);
    const { data: rows } = await supabase
      .from("ent_deals")
      .select("*")
      .order("created_at", { ascending: false });
    setData((rows || []) as EntDeal[]);
    setLoading(false);
  }, []);

  useEffect(() => { refetch(); }, [refetch]);
  return { data, loading, refetch };
}

export function useEntTasks() {
  const [data, setData] = useState<EntTask[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    setLoading(true);
    const { data: rows } = await supabase
      .from("ent_tasks")
      .select("*")
      .order("due_date", { ascending: true, nullsFirst: false });
    setData((rows || []) as EntTask[]);
    setLoading(false);
  }, []);

  useEffect(() => { refetch(); }, [refetch]);
  return { data, loading, refetch };
}

export function useEntNotes() {
  const [data, setData] = useState<EntNote[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    setLoading(true);
    const { data: rows } = await supabase
      .from("ent_notes")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    setData((rows || []) as EntNote[]);
    setLoading(false);
  }, []);

  useEffect(() => { refetch(); }, [refetch]);
  return { data, loading, refetch };
}

export const fmtGBP = (n: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(n || 0);