import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface FounderMetrics {
  mrrGbp: number;
  arrGbp: number;
  activeCustomers: number;
  trialCustomers: number;
  newLeadsToday: number;
  openDeals: number;
  churnPct: number;
  failedPayments: number;
  refundRequests: number;
  urgentLeads: number;
  emailsAwaitingReply: number;
  revenueByMonth: { month: string; gbp: number }[];
  revenueByPlan: { plan: string; gbp: number; count: number }[];
  revenueByCountry: { country: string; gbp: number; leads: number }[];
  lastUpdated: Date | null;
  refresh: () => void;
  loading: boolean;
}

// GBP base prices for each plan (matches pricing page)
const PLAN_GBP: Record<string, number> = {
  basic: 25,
  pro: 52,
  premium: 108,
  trial: 0,
  enterprise: 499,
};

export function useFounderMetrics(): FounderMetrics {
  const [m, setM] = useState<FounderMetrics>({
    mrrGbp: 0, arrGbp: 0, activeCustomers: 0, trialCustomers: 0, newLeadsToday: 0, openDeals: 0,
    churnPct: 0, failedPayments: 0, refundRequests: 0, urgentLeads: 0, emailsAwaitingReply: 0,
    revenueByMonth: [], revenueByPlan: [], revenueByCountry: [],
    lastUpdated: null, refresh: () => {}, loading: true,
  });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const todayIso = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
      const [subs, leads, deals, alerts, refunds] = await Promise.all([
        supabase.from("subscriptions").select("plan,status,created_at,current_period_end"),
        supabase.from("enterprise_leads").select("id,status,country,created_at"),
        supabase.from("ent_deals").select("id,stage,value_gbp,created_at"),
        supabase.from("admin_alerts").select("alert_type,created_at").in("alert_type", ["payment_failed", "high_value_churn", "refund_issued"]),
        supabase.from("payment_refunds").select("id,amount,status,created_at").gte("created_at", new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString()),
      ]);

      const subsData = subs.data || [];
      const active = subsData.filter((s: any) => ["active", "trialing"].includes(s.status));
      const trials = subsData.filter((s: any) => s.status === "trialing");
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
      const refundsData = refunds.data || [];

      // Revenue by month (cumulative MRR over last 6 months)
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
      let running = 0;
      const revenueByMonth = Object.entries(months).map(([month, v]) => {
        running += v;
        return { month, gbp: running };
      });

      // Revenue by plan
      const planMap: Record<string, { count: number; gbp: number }> = {};
      active.forEach((s: any) => {
        const k = s.plan || "unknown";
        planMap[k] = planMap[k] || { count: 0, gbp: 0 };
        planMap[k].count += 1;
        planMap[k].gbp += PLAN_GBP[s.plan] || 0;
      });
      const revenueByPlan = Object.entries(planMap)
        .map(([plan, v]) => ({ plan, gbp: v.gbp, count: v.count }))
        .sort((a, b) => b.gbp - a.gbp);

      // Revenue by country (proxy: enterprise lead estimated value + active sub plans cannot be geo-located)
      const countryMap: Record<string, { leads: number; gbp: number }> = {};
      leadsData.forEach((l: any) => {
        const k = l.country || "Unknown";
        countryMap[k] = countryMap[k] || { leads: 0, gbp: 0 };
        countryMap[k].leads += 1;
        countryMap[k].gbp += 0;
      });
      const revenueByCountry = Object.entries(countryMap)
        .map(([country, v]) => ({ country, gbp: v.gbp, leads: v.leads }))
        .sort((a, b) => b.leads - a.leads)
        .slice(0, 8);

      if (cancelled) return;
      setM((prev) => ({
        ...prev,
        mrrGbp: mrr,
        arrGbp: mrr * 12,
        activeCustomers: active.length,
        trialCustomers: trials.length,
        newLeadsToday: newToday,
        openDeals: open,
        churnPct: Math.round(churn * 10) / 10,
        failedPayments: failed,
        refundRequests: refundsData.length,
        urgentLeads: urgent,
        emailsAwaitingReply: urgent,
        revenueByMonth,
        revenueByPlan,
        revenueByCountry,
        lastUpdated: new Date(),
        refresh: () => setTick((x) => x + 1),
        loading: false,
      }));
    };
    load();
    const interval = setInterval(load, 60_000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [tick]);

  return m;
}
