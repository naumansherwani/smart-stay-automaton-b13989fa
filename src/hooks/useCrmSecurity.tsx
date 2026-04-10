import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface SecurityAlert {
  id: string;
  user_id: string;
  alert_type: string;
  severity: string;
  title: string;
  message: string;
  is_resolved: boolean;
  resolved_at: string | null;
  metadata: any;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  action_type: string;
  entity_type: string;
  entity_id: string | null;
  description: string | null;
  created_at: string;
}

export function useCrmSecurity() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAlerts = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("crm_security_alerts" as any)
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);
    if (data) setAlerts(data as any);
  }, [user]);

  const fetchLogs = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("crm_activity_logs" as any)
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);
    if (data) setLogs(data as any);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    Promise.all([fetchAlerts(), fetchLogs()]).finally(() => setLoading(false));

    // Realtime alerts
    const channel = supabase
      .channel("crm-security-alerts")
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "crm_security_alerts",
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        setAlerts(prev => [payload.new as any, ...prev].slice(0, 20));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, fetchAlerts, fetchLogs]);

  const resolveAlert = useCallback(async (id: string) => {
    await supabase.from("crm_security_alerts" as any)
      .update({ is_resolved: true, resolved_at: new Date().toISOString() } as any)
      .eq("id", id);
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, is_resolved: true } : a));
  }, []);

  const unresolvedCount = alerts.filter(a => !a.is_resolved).length;

  return { alerts, logs, loading, resolveAlert, unresolvedCount, refresh: () => Promise.all([fetchAlerts(), fetchLogs()]) };
}
