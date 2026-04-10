import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useProfile } from "./useProfile";
import type { IndustryType } from "@/lib/industryConfig";

export interface CrmTask {
  id: string;
  user_id: string;
  industry: IndustryType;
  title: string;
  description: string | null;
  category: string;
  priority: string;
  status: string;
  due_date: string | null;
  scheduled_time: string | null;
  estimated_minutes: number | null;
  completed_at: string | null;
  linked_contact_id: string | null;
  linked_deal_id: string | null;
  linked_ticket_id: string | null;
  ai_priority_score: number | null;
  ai_category: string | null;
  ai_suggestions: any[];
  recurrence_rule: string | null;
  is_recurring: boolean;
  sort_order: number;
  metadata: any;
  created_at: string;
  updated_at: string;
}

export function useCrmTasks() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [tasks, setTasks] = useState<CrmTask[]>([]);
  const [loading, setLoading] = useState(true);

  const industry = (profile?.industry || "hospitality") as IndustryType;

  const fetchTasks = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("crm_tasks")
      .select("*")
      .eq("industry", industry)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });
    setTasks((data as unknown as CrmTask[]) || []);
    setLoading(false);
  }, [user, industry]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const addTask = async (task: {
    title: string;
    description?: string;
    category?: string;
    priority?: string;
    due_date?: string;
    scheduled_time?: string;
    estimated_minutes?: number;
    linked_contact_id?: string;
    linked_deal_id?: string;
    linked_ticket_id?: string;
  }) => {
    if (!user) return;
    const { data, error } = await supabase
      .from("crm_tasks")
      .insert({ ...task, user_id: user.id, industry } as any)
      .select()
      .single();
    if (!error && data) setTasks(prev => [data as unknown as CrmTask, ...prev]);
    return { data, error };
  };

  const updateTask = async (id: string, updates: Record<string, unknown>) => {
    const { error } = await supabase.from("crm_tasks").update(updates as any).eq("id", id);
    if (!error) setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } as CrmTask : t));
    return { error };
  };

  const deleteTask = async (id: string) => {
    const { error } = await supabase.from("crm_tasks").delete().eq("id", id);
    if (!error) setTasks(prev => prev.filter(t => t.id !== id));
    return { error };
  };

  const completeTask = async (id: string) => {
    const now = new Date().toISOString();
    return updateTask(id, { status: "done", completed_at: now });
  };

  const reopenTask = async (id: string) => {
    return updateTask(id, { status: "pending", completed_at: null });
  };

  const todayTasks = tasks.filter(t => {
    const today = new Date().toISOString().split("T")[0];
    return t.due_date === today || (t.scheduled_time && t.scheduled_time.startsWith(today));
  });

  const pendingTasks = tasks.filter(t => t.status === "pending" || t.status === "in_progress");
  const completedTasks = tasks.filter(t => t.status === "done");
  const overdueTasks = tasks.filter(t => {
    if (!t.due_date || t.status === "done") return false;
    return new Date(t.due_date) < new Date(new Date().toISOString().split("T")[0]);
  });

  return {
    tasks, loading, addTask, updateTask, deleteTask, completeTask, reopenTask,
    todayTasks, pendingTasks, completedTasks, overdueTasks, refresh: fetchTasks,
  };
}
