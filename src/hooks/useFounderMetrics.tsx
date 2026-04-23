import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface FounderMetrics {
  mrrGbp: number;
  arrGbp: number;
  activeCustomers: number;
  newLeadsToday: number;
  openDeals: number;
  churnPct: number;
  failedPayments: number;
  urgentLeads: number;
  emailsAwaitingReply: number;
  revenueByMonth: { month: string; gbp: number }[];
  loading: boolean;
}

// GBP base prices for each plan (matches pricing page)
const PLAN_GBP: Record<string, number> = {
  basic: 19,
  pro: 49,
  premium: 99,
  trial: 0,
  enterprise: 499,
};

export function useFounderMetrics(): FounderMetrics {
  const [m, setM] = useState<FounderMetrics>({
    mrrGbp: 0, arrGbp: 0, activeCustomers: 0, newLeadsToday: 0, openDeals: 0,
    churnPct: 0, failedPayments: 0, urgentLeads: 0, emailsAwaitingReply: 0,
    revenueByMonth: [], loading: true,
  });

  useEffect(() => {
    (async () => {
      const todayIso = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
      const [subs, leads, deals, alerts] = await Promise.all([
        supabase.from("subscriptions").select("plan,status,created_at,current_period_end"),
        supabase.from("enterprise_leads").select("id,status,created_at"),
        supabase.from("ent_deals").select("id,stage,value_gbp,created_at"),
        supabase.from("admin_alerts").select("alert_type,created_at").in("alert_type", ["payment_failed", "high_value_churn", "refund_issued"]),
      ]);

      const subsData = subs.data || [];
      const active = subsData.filter((s: any) => ["active", "trialing"].includes(s.status));
      const canceled = subsData.filter((s: any) => s.status === "canceled");
      const mrr = active.reduce((sum: number, s: any) => sum + (PLAN_GBP[s.plan] || 0), 0);
      const total = active.length + canceled.length || 1;
      const churn = (canceled.length / total) * 100;

      const leadsData = leads.data || [];
      const newToday = leadsData.filter((l: any) => l.created_at > todayIso).length;
      const urgent = leadsData.filter((l: any) => ["new", "contacted"].includes(l.status)).length;

      const dealsData = deals.data || [];
      const open = dealsData.filter((d: any) => !["won", "lost"].includes(d.stage)).length;

      const alertsData = alerts.data || [];
      const failed = alertsData.filter((a: any) => a.alert_type === "payment_failed").length;

      // Revenue by month (last 6 months from active subs created date)
      const months: Record<string, number> = {};
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months[d.toLocaleString("en-GB", { month: "short" })] = 0;
      }
      active.forEach((s: any) => {
        const d = new Date(s.created_at);
        const key = d.toLocaleString("en-GB", { month: "short" });
        if (key in months) months[key] += PLAN_GBP[s.plan] || 0;
      });
      // Cumulative MRR view
      let running = 0;
      const revenueByMonth = Object.entries(months).map(([month, v]) => {
        running += v;
        return { month, gbp: running };
      });

      setM({
        mrrGbp: mrr,
        arrGbp: mrr * 12,
        activeCustomers: active.length,
        newLeadsToday: newToday,
        openDeals: open,
        churnPct: Math.round(churn * 10) / 10,
        failedPayments: failed,
        urgentLeads: urgent,
        emailsAwaitingReply: urgent, // proxy
        revenueByMonth,
        loading: false,
      });
    })();
  }, []);

  return m;
}
