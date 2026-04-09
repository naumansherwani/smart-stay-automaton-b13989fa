import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useProfile } from "./useProfile";
import type { IndustryType } from "@/lib/industryConfig";

export interface CrmContact {
  id: string;
  user_id: string;
  industry: IndustryType;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  avatar_url: string | null;
  address: string | null;
  lifecycle_stage: string;
  source: string | null;
  tags: string[];
  ai_score: number;
  ai_score_reason: string | null;
  last_contacted_at: string | null;
  total_bookings: number;
  total_revenue: number;
  churn_risk: string;
  notes: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface CrmTicket {
  id: string;
  user_id: string;
  industry: IndustryType;
  contact_id: string | null;
  ticket_number: string;
  subject: string;
  description: string | null;
  category: string;
  status: string;
  priority: string;
  assigned_to: string | null;
  ai_summary: string | null;
  ai_suggested_resolution: string | null;
  ai_category: string | null;
  ai_sentiment: string | null;
  resolution_notes: string | null;
  resolved_at: string | null;
  sla_deadline: string | null;
  source: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  contact?: CrmContact;
}

export interface CrmDeal {
  id: string;
  user_id: string;
  industry: IndustryType;
  contact_id: string | null;
  pipeline_id: string | null;
  title: string;
  value: number;
  currency: string;
  probability: number;
  stage: string;
  expected_close_date: string | null;
  won_at: string | null;
  lost_at: string | null;
  lost_reason: string | null;
  notes: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  contact?: CrmContact;
}

export interface CrmActivity {
  id: string;
  user_id: string;
  industry: IndustryType;
  contact_id: string | null;
  deal_id: string | null;
  ticket_id: string | null;
  type: string;
  subject: string | null;
  description: string | null;
  scheduled_at: string | null;
  completed_at: string | null;
  is_completed: boolean;
  ai_generated: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface CrmPipeline {
  id: string;
  user_id: string;
  industry: IndustryType;
  name: string;
  stages: { name: string; order: number }[];
  is_default: boolean;
  color: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export function useCrmContacts() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [contacts, setContacts] = useState<CrmContact[]>([]);
  const [loading, setLoading] = useState(true);

  const industry = profile?.industry || "hospitality";

  const fetchContacts = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("crm_contacts")
      .select("*")
      .eq("industry", industry)
      .order("created_at", { ascending: false });
    setContacts((data as CrmContact[]) || []);
    setLoading(false);
  }, [user, industry]);

  useEffect(() => { fetchContacts(); }, [fetchContacts]);

  const addContact = async (contact: Partial<CrmContact>) => {
    if (!user) return;
    const { data, error } = await supabase
      .from("crm_contacts")
      .insert({ ...contact, user_id: user.id, industry })
      .select()
      .single();
    if (!error && data) {
      setContacts(prev => [data as CrmContact, ...prev]);
    }
    return { data, error };
  };

  const updateContact = async (id: string, updates: Partial<CrmContact>) => {
    const { error } = await supabase.from("crm_contacts").update(updates).eq("id", id);
    if (!error) setContacts(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    return { error };
  };

  const deleteContact = async (id: string) => {
    const { error } = await supabase.from("crm_contacts").delete().eq("id", id);
    if (!error) setContacts(prev => prev.filter(c => c.id !== id));
    return { error };
  };

  return { contacts, loading, addContact, updateContact, deleteContact, refresh: fetchContacts };
}

export function useCrmTickets() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [tickets, setTickets] = useState<CrmTicket[]>([]);
  const [loading, setLoading] = useState(true);

  const industry = profile?.industry || "hospitality";

  const fetchTickets = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("crm_tickets")
      .select("*, contact:crm_contacts(id, name, email)")
      .eq("industry", industry)
      .order("created_at", { ascending: false });
    setTickets((data as unknown as CrmTicket[]) || []);
    setLoading(false);
  }, [user, industry]);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  const addTicket = async (ticket: Partial<CrmTicket>) => {
    if (!user) return;
    const { data, error } = await supabase
      .from("crm_tickets")
      .insert({ ...ticket, user_id: user.id, industry })
      .select()
      .single();
    if (!error && data) setTickets(prev => [data as unknown as CrmTicket, ...prev]);
    return { data, error };
  };

  const updateTicket = async (id: string, updates: Partial<CrmTicket>) => {
    const { error } = await supabase.from("crm_tickets").update(updates).eq("id", id);
    if (!error) setTickets(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    return { error };
  };

  const deleteTicket = async (id: string) => {
    const { error } = await supabase.from("crm_tickets").delete().eq("id", id);
    if (!error) setTickets(prev => prev.filter(t => t.id !== id));
    return { error };
  };

  return { tickets, loading, addTicket, updateTicket, deleteTicket, refresh: fetchTickets };
}

export function useCrmDeals() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [deals, setDeals] = useState<CrmDeal[]>([]);
  const [loading, setLoading] = useState(true);

  const industry = profile?.industry || "hospitality";

  const fetchDeals = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("crm_deals")
      .select("*, contact:crm_contacts(id, name, email)")
      .eq("industry", industry)
      .order("created_at", { ascending: false });
    setDeals((data as unknown as CrmDeal[]) || []);
    setLoading(false);
  }, [user, industry]);

  useEffect(() => { fetchDeals(); }, [fetchDeals]);

  const addDeal = async (deal: Partial<CrmDeal>) => {
    if (!user) return;
    const { data, error } = await supabase
      .from("crm_deals")
      .insert({ ...deal, user_id: user.id, industry })
      .select()
      .single();
    if (!error && data) setDeals(prev => [data as unknown as CrmDeal, ...prev]);
    return { data, error };
  };

  const updateDeal = async (id: string, updates: Partial<CrmDeal>) => {
    const { error } = await supabase.from("crm_deals").update(updates).eq("id", id);
    if (!error) setDeals(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d));
    return { error };
  };

  return { deals, loading, addDeal, updateDeal, refresh: fetchDeals };
}

export function useCrmActivities(contactId?: string) {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [activities, setActivities] = useState<CrmActivity[]>([]);
  const [loading, setLoading] = useState(true);

  const industry = profile?.industry || "hospitality";

  const fetchActivities = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    let query = supabase
      .from("crm_activities")
      .select("*")
      .eq("industry", industry)
      .order("created_at", { ascending: false })
      .limit(100);
    if (contactId) query = query.eq("contact_id", contactId);
    const { data } = await query;
    setActivities((data as CrmActivity[]) || []);
    setLoading(false);
  }, [user, industry, contactId]);

  useEffect(() => { fetchActivities(); }, [fetchActivities]);

  const addActivity = async (activity: Partial<CrmActivity>) => {
    if (!user) return;
    const { data, error } = await supabase
      .from("crm_activities")
      .insert({ ...activity, user_id: user.id, industry })
      .select()
      .single();
    if (!error && data) setActivities(prev => [data as CrmActivity, ...prev]);
    return { data, error };
  };

  return { activities, loading, addActivity, refresh: fetchActivities };
}

export function useCrmPipelines() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [pipelines, setPipelines] = useState<CrmPipeline[]>([]);
  const [loading, setLoading] = useState(true);

  const industry = profile?.industry || "hospitality";

  const fetchPipelines = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("crm_pipelines")
      .select("*")
      .eq("industry", industry)
      .order("created_at", { ascending: true });
    setPipelines((data as unknown as CrmPipeline[]) || []);
    setLoading(false);
  }, [user, industry]);

  useEffect(() => { fetchPipelines(); }, [fetchPipelines]);

  const addPipeline = async (pipeline: Partial<CrmPipeline>) => {
    if (!user) return;
    const { data, error } = await supabase
      .from("crm_pipelines")
      .insert({ ...pipeline, user_id: user.id, industry })
      .select()
      .single();
    if (!error && data) setPipelines(prev => [...prev, data as unknown as CrmPipeline]);
    return { data, error };
  };

  return { pipelines, loading, addPipeline, refresh: fetchPipelines };
}
