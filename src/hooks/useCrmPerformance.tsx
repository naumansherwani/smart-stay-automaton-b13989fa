import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useProfile } from "./useProfile";

export interface PerformanceReport {
  id: string;
  user_id: string;
  industry: string;
  report_month: string;
  total_work_seconds: number;
  total_break_seconds: number;
  total_sessions: number;
  total_breaks: number;
  avg_session_minutes: number;
  longest_session_minutes: number;
  days_active: number;
  productivity_score: number;
  ai_summary: string | null;
  ai_recommendations: any;
  is_read: boolean;
  metadata: any;
  created_at: string;
}

export interface TodayPerformance {
  workSeconds: number;
  breakSeconds: number;
  sessions: number;
  breaks: number;
}

export function useCrmPerformance() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [reports, setReports] = useState<PerformanceReport[]>([]);
  const [todayStats, setTodayStats] = useState<TodayPerformance>({ workSeconds: 0, breakSeconds: 0, sessions: 0, breaks: 0 });
  const [weeklyStats, setWeeklyStats] = useState<{ day: string; work: number; breaks: number }[]>([]);
  const [unreadReport, setUnreadReport] = useState<PerformanceReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const industry = profile?.industry || "hospitality";

  const fetchReports = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const { data } = await supabase
      .from("crm_performance_reports")
      .select("*")
      .eq("user_id", user.id)
      .eq("industry", industry)
      .order("report_month", { ascending: false })
      .limit(12);

    const reports = (data || []) as unknown as PerformanceReport[];
    setReports(reports);

    const unread = reports.find(r => !r.is_read);
    setUnreadReport(unread || null);

    setLoading(false);
  }, [user, industry]);

  const fetchTodayStats = useCallback(async () => {
    if (!user) return;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data } = await supabase
      .from("crm_work_sessions")
      .select("*")
      .eq("user_id", user.id)
      .eq("industry", industry)
      .gte("started_at", today.toISOString())
      .not("ended_at", "is", null);

    if (data) {
      const sessions = data as any[];
      const workSessions = sessions.filter(s => s.session_type === "work");
      const breakSessions = sessions.filter(s => s.session_type === "break");
      setTodayStats({
        workSeconds: workSessions.reduce((sum, s) => sum + (s.duration_seconds || 0), 0),
        breakSeconds: breakSessions.reduce((sum, s) => sum + (s.duration_seconds || 0), 0),
        sessions: workSessions.length,
        breaks: breakSessions.length,
      });
    }
  }, [user, industry]);

  const fetchWeeklyStats = useCallback(async () => {
    if (!user) return;
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 6);
    weekAgo.setHours(0, 0, 0, 0);

    const { data } = await supabase
      .from("crm_work_sessions")
      .select("*")
      .eq("user_id", user.id)
      .eq("industry", industry)
      .gte("started_at", weekAgo.toISOString())
      .not("ended_at", "is", null);

    if (data) {
      const days: Record<string, { work: number; breaks: number }> = {};
      for (let i = 0; i < 7; i++) {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        const key = d.toLocaleDateString("en", { weekday: "short" });
        days[key] = { work: 0, breaks: 0 };
      }

      (data as any[]).forEach(s => {
        const key = new Date(s.started_at).toLocaleDateString("en", { weekday: "short" });
        if (days[key]) {
          const mins = Math.round((s.duration_seconds || 0) / 60);
          if (s.session_type === "work") days[key].work += mins;
          else days[key].breaks += mins;
        }
      });

      setWeeklyStats(Object.entries(days).map(([day, v]) => ({ day, ...v })));
    }
  }, [user, industry]);

  useEffect(() => {
    fetchReports();
    fetchTodayStats();
    fetchWeeklyStats();
  }, [fetchReports, fetchTodayStats, fetchWeeklyStats]);

  const generateReport = async () => {
    if (!user) return;
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("crm-performance-report", {
        body: { industry },
      });
      if (error) throw error;
      await fetchReports();
    } catch (e) {
      console.error("Failed to generate report:", e);
    }
    setGenerating(false);
  };

  const markReportRead = async (reportId: string) => {
    await supabase
      .from("crm_performance_reports")
      .update({ is_read: true })
      .eq("id", reportId);
    setUnreadReport(null);
    setReports(prev => prev.map(r => r.id === reportId ? { ...r, is_read: true } : r));
  };

  return {
    reports, todayStats, weeklyStats, unreadReport, loading, generating,
    generateReport, markReportRead, refresh: fetchReports,
  };
}
