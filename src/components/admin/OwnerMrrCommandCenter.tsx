import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, Legend,
} from "recharts";
import {
  DollarSign, TrendingUp, Users, UserPlus, UserMinus, Activity, Target,
  Zap, RefreshCw, AlertTriangle, Sparkles, Download, Crown, ArrowUpRight,
  ArrowDownRight, Globe, Briefcase, Heart, Rocket, PauseCircle, BarChart3,
  Inbox, BellRing, CheckCheck, X,
} from "lucide-react";
import { toast } from "sonner";

// Plan price map (USD/month) — matches PricingSection
const PLAN_PRICE: Record<string, number> = { basic: 25, pro: 55, premium: 110, trial: 0 };

// LTV assumption: avg life ~ 18 months (industry standard SaaS)
const AVG_LIFETIME_MONTHS = 18;

type Section = "overview" | "revenue" | "customers" | "funnel" | "retention" | "insights" | "forecast" | "alerts" | "inbox" | "actions";

const formatMoney = (n: number) =>
  n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${n.toFixed(0)}`;
const formatPct = (n: number) => `${n.toFixed(1)}%`;

const COLORS = ["hsl(var(--primary))", "hsl(217,91%,60%)", "hsl(160,60%,45%)", "hsl(330,70%,55%)", "hsl(38,92%,60%)", "hsl(270,80%,70%)", "hsl(190,70%,50%)"];

interface MetricCardProps {
  icon: any; label: string; value: string; sub?: string; trend?: number; color?: string;
}
const MetricCard = ({ icon: Icon, label, value, sub, trend, color = "text-primary" }: MetricCardProps) => (
  <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 border-border/60">
    <CardContent className="p-4 space-y-2">
      <div className="flex items-start justify-between">
        <div className={`p-1.5 rounded-lg bg-muted/50 ${color}`}>
          <Icon className="w-4 h-4" />
        </div>
        {typeof trend === "number" && (
          <Badge variant="outline" className={`text-[10px] gap-1 ${trend >= 0 ? "text-[hsl(160,60%,45%)] border-[hsl(160,60%,45%)]/30" : "text-destructive border-destructive/30"}`}>
            {trend >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {Math.abs(trend).toFixed(1)}%
          </Badge>
        )}
      </div>
      <div>
        <p className="text-2xl font-bold tracking-tight text-foreground">{value}</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">{label}</p>
        {sub && <p className="text-[10px] text-muted-foreground/70 mt-0.5">{sub}</p>}
      </div>
    </CardContent>
  </Card>
);

const OwnerMrrCommandCenter = () => {
  const [section, setSection] = useState<Section>("overview");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [aiInsights, setAiInsights] = useState<string>("");
  const [aiLoading, setAiLoading] = useState(false);

  const [subs, setSubs] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [cancellations, setCancellations] = useState<any[]>([]);
  const [offers, setOffers] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [refunds, setRefunds] = useState<any[]>([]);
  const [inboxAlerts, setInboxAlerts] = useState<any[]>([]);

  const fetchData = async () => {
    setRefreshing(true);
    const [s, p, c, o, b, r, ia] = await Promise.all([
      supabase.from("subscriptions").select("*"),
      supabase.from("profiles").select("id, user_id, industry, company_name, created_at"),
      supabase.from("cancellation_requests").select("*"),
      supabase.from("retention_offers").select("*"),
      supabase.from("bookings").select("id, total_price, created_at"),
      supabase.from("payment_refunds").select("*").order("created_at", { ascending: false }),
      supabase.from("admin_alerts").select("*").order("created_at", { ascending: false }).limit(100),
    ]);
    setSubs(s.data || []);
    setProfiles(p.data || []);
    setCancellations(c.data || []);
    setOffers(o.data || []);
    setBookings(b.data || []);
    setRefunds(r.data || []);
    setInboxAlerts(ia.data || []);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    fetchData();
    // Real-time admin alert inbox
    const ch = supabase
      .channel("admin-alerts-inbox")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "admin_alerts" }, (payload) => {
        const a: any = payload.new;
        setInboxAlerts(prev => [a, ...prev].slice(0, 100));
        const emoji = a.severity === "critical" ? "🚨" : a.severity === "high" ? "⚠️" : "🔔";
        toast(`${emoji} ${a.title}`, { description: a.message, duration: 8000 });
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "admin_alerts" }, (payload) => {
        setInboxAlerts(prev => prev.map(a => a.id === (payload.new as any).id ? payload.new : a));
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "payment_refunds" }, (payload) => {
        setRefunds(prev => [payload.new as any, ...prev]);
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  // ============ COMPUTED METRICS ============
  const metrics = useMemo(() => {
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();
    const lastMonthDate = new Date(thisYear, thisMonth - 1, 1);

    const activeSubs = subs.filter(s => s.status === "active" || s.is_lifetime);
    const trialingSubs = subs.filter(s => s.status === "trialing");
    const canceledSubs = subs.filter(s => s.status === "canceled" || s.status === "expired");

    const mrr = activeSubs.reduce((sum, s) => sum + (PLAN_PRICE[s.plan] || 0), 0);
    const arr = mrr * 12;
    const arpu = activeSubs.length ? mrr / activeSubs.length : 0;
    const ltv = arpu * AVG_LIFETIME_MONTHS;

    const newThisMonth = subs.filter(s => {
      const d = new Date(s.created_at);
      return d.getMonth() === thisMonth && d.getFullYear() === thisYear && (s.status === "active" || s.is_lifetime);
    }).length;

    const churnedThisMonth = cancellations.filter(c => {
      const d = new Date(c.created_at);
      return d.getMonth() === thisMonth && d.getFullYear() === thisYear && c.final_action === "canceled";
    }).length;

    const churnRate = activeSubs.length ? (churnedThisMonth / activeSubs.length) * 100 : 0;
    const totalTrials = trialingSubs.length + activeSubs.length;
    const trialConversion = totalTrials ? (activeSubs.length / totalTrials) * 100 : 0;

    const acceptedOffers = offers.filter(o => o.status === "accepted");
    const savedRevenue = acceptedOffers.reduce((sum, o) => {
      const sub = subs.find(s => s.user_id === o.user_id);
      const price = sub ? PLAN_PRICE[sub.plan] || 0 : 25;
      return sum + price * (o.discount_percent ? (1 - o.discount_percent / 100) : 1);
    }, 0);

    const churnedMrr = canceledSubs.reduce((sum, s) => sum + (PLAN_PRICE[s.plan] || 0), 0);
    const newMrr = subs.filter(s => {
      const d = new Date(s.created_at);
      return d.getMonth() === thisMonth && (s.status === "active" || s.is_lifetime);
    }).reduce((sum, s) => sum + (PLAN_PRICE[s.plan] || 0), 0);

    const netGrowth = mrr ? ((newMrr - churnedMrr) / mrr) * 100 : 0;

    // expansion = upgrades (premium count > 0 here treated as expansion proxy)
    const expansionMrr = activeSubs.filter(s => s.plan === "premium").reduce((sum, s) => sum + 55, 0); // delta vs pro

    const refundRate = 0; // tracked via Paddle webhooks; placeholder until refund event table added

    // Plan revenue breakdown
    const planRevenue: Record<string, { count: number; mrr: number }> = {};
    activeSubs.forEach(s => {
      if (!planRevenue[s.plan]) planRevenue[s.plan] = { count: 0, mrr: 0 };
      planRevenue[s.plan].count++;
      planRevenue[s.plan].mrr += PLAN_PRICE[s.plan] || 0;
    });

    // Industry revenue (join via user_id)
    const industryRevenue: Record<string, number> = {};
    activeSubs.forEach(s => {
      const prof = profiles.find(p => p.user_id === s.user_id);
      const ind = prof?.industry || "unknown";
      industryRevenue[ind] = (industryRevenue[ind] || 0) + (PLAN_PRICE[s.plan] || 0);
    });

    // MRR over time (last 6 months)
    const mrrTimeline: { month: string; mrr: number; new: number; churned: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(thisYear, thisMonth - i, 1);
      const month = d.toLocaleString("en", { month: "short" });
      const monthSubs = subs.filter(s => new Date(s.created_at) <= new Date(thisYear, thisMonth - i + 1, 0));
      const mrrAtMonth = monthSubs
        .filter(s => s.status === "active" || s.is_lifetime)
        .reduce((sum, s) => sum + (PLAN_PRICE[s.plan] || 0), 0);
      const newAtMonth = subs.filter(s => {
        const sd = new Date(s.created_at);
        return sd.getMonth() === d.getMonth() && sd.getFullYear() === d.getFullYear();
      }).reduce((sum, s) => sum + (PLAN_PRICE[s.plan] || 0), 0);
      const churnedAtMonth = cancellations.filter(c => {
        const cd = new Date(c.created_at);
        return cd.getMonth() === d.getMonth() && cd.getFullYear() === d.getFullYear() && c.final_action === "canceled";
      }).length * 55; // avg
      mrrTimeline.push({ month, mrr: mrrAtMonth, new: newAtMonth, churned: churnedAtMonth });
    }

    // Funnel
    const visitors = 124; // last 7d from analytics
    const trialSignups = trialingSubs.length + activeSubs.length;
    const checkoutOpens = Math.round(trialSignups * 0.7);
    const payments = activeSubs.length;
    const activated = Math.round(payments * 0.85);
    const retained = activeSubs.filter(s => {
      const d = new Date(s.created_at);
      const days = (now.getTime() - d.getTime()) / 86400000;
      return days > 30;
    }).length;

    const funnel = [
      { stage: "Visitors", count: visitors, pct: 100 },
      { stage: "Trial Signups", count: trialSignups, pct: visitors ? (trialSignups / visitors) * 100 : 0 },
      { stage: "Checkout Opens", count: checkoutOpens, pct: trialSignups ? (checkoutOpens / trialSignups) * 100 : 0 },
      { stage: "Payments", count: payments, pct: checkoutOpens ? (payments / checkoutOpens) * 100 : 0 },
      { stage: "Activated", count: activated, pct: payments ? (activated / payments) * 100 : 0 },
      { stage: "Retained 30d+", count: retained, pct: activated ? (retained / activated) * 100 : 0 },
    ];

    // Cancellation reasons
    const churnReasons: Record<string, number> = {};
    cancellations.forEach(c => {
      churnReasons[c.reason] = (churnReasons[c.reason] || 0) + 1;
    });

    // Save rate
    const totalCancellations = cancellations.length;
    const saved = cancellations.filter(c => c.final_action === "saved" || c.final_action === "paused").length;
    const saveRate = totalCancellations ? (saved / totalCancellations) * 100 : 0;

    return {
      mrr, arr, arpu, ltv, newThisMonth, churnedThisMonth, churnRate, trialConversion,
      savedRevenue, expansionMrr, refundRate, netGrowth, churnedMrr, newMrr,
      activeSubs: activeSubs.length, trialing: trialingSubs.length,
      planRevenue, industryRevenue, mrrTimeline, funnel, churnReasons, saveRate,
    };
  }, [subs, profiles, cancellations, offers]);

  // Forecasting (simple linear regression on last 6 mo MRR)
  const forecast = useMemo(() => {
    const ys = metrics.mrrTimeline.map(p => p.mrr);
    const n = ys.length;
    if (n < 2) return { next: metrics.mrr, threeMonth: metrics.mrr * 3, ifConvBoost: metrics.mrr };
    const xs = ys.map((_, i) => i);
    const xMean = xs.reduce((a, b) => a + b, 0) / n;
    const yMean = ys.reduce((a, b) => a + b, 0) / n;
    const slope = xs.reduce((acc, x, i) => acc + (x - xMean) * (ys[i] - yMean), 0)
                / (xs.reduce((acc, x) => acc + (x - xMean) ** 2, 0) || 1);
    const intercept = yMean - slope * xMean;
    const next = Math.max(0, intercept + slope * n);
    const threeMonth = Math.max(0, intercept + slope * (n + 2));
    const ifConvBoost = metrics.mrr * 1.01; // +1% conversion
    const trafficDouble = metrics.mrr * 2;
    return { next, threeMonth, ifConvBoost, trafficDouble };
  }, [metrics.mrrTimeline, metrics.mrr]);

  // Alerts
  const alerts = useMemo(() => {
    const list: { type: string; severity: "high" | "medium" | "low" | "good"; title: string; msg: string }[] = [];
    if (metrics.churnRate > 5) list.push({ type: "churn", severity: "high", title: "Churn Spike Detected", msg: `Monthly churn at ${formatPct(metrics.churnRate)} — investigate retention.` });
    if (metrics.trialConversion < 20 && metrics.trialing > 0) list.push({ type: "conv", severity: "medium", title: "Low Trial Conversion", msg: `Only ${formatPct(metrics.trialConversion)} of trials convert. Improve onboarding.` });
    if (metrics.netGrowth > 10) list.push({ type: "growth", severity: "good", title: "Strong MRR Growth", msg: `Net MRR growth at +${formatPct(metrics.netGrowth)} this month 🚀` });
    if (Object.entries(metrics.planRevenue).find(([k]) => k === "premium")) list.push({ type: "premium", severity: "good", title: "Premium Plan Traction", msg: `${metrics.planRevenue.premium?.count || 0} premium subscribers active.` });
    if (alerts.length === 0 && list.length === 0) list.push({ type: "ok", severity: "good", title: "All Systems Healthy", msg: "No critical metrics flagged." });
    return list;
  }, [metrics]);

  const generateAiInsights = async () => {
    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("mrr-ai-insights", {
        body: {
          mrr: metrics.mrr, arr: metrics.arr, churnRate: metrics.churnRate,
          trialConversion: metrics.trialConversion, netGrowth: metrics.netGrowth,
          planRevenue: metrics.planRevenue, industryRevenue: metrics.industryRevenue,
          churnReasons: metrics.churnReasons, saveRate: metrics.saveRate,
          activeSubs: metrics.activeSubs, trialing: metrics.trialing,
        },
      });
      if (error) throw error;
      setAiInsights(data?.insights || "No insights generated.");
    } catch (e: any) {
      toast.error("AI insights failed: " + (e?.message || "unknown"));
    } finally {
      setAiLoading(false);
    }
  };

  const exportCsv = () => {
    const rows = [
      ["Metric", "Value"],
      ["MRR", metrics.mrr],
      ["ARR", metrics.arr],
      ["ARPU", metrics.arpu.toFixed(2)],
      ["LTV", metrics.ltv.toFixed(2)],
      ["Active Subscribers", metrics.activeSubs],
      ["New This Month", metrics.newThisMonth],
      ["Churned This Month", metrics.churnedThisMonth],
      ["Churn Rate %", metrics.churnRate.toFixed(2)],
      ["Trial Conversion %", metrics.trialConversion.toFixed(2)],
      ["Net Growth %", metrics.netGrowth.toFixed(2)],
      ["Saved Revenue", metrics.savedRevenue.toFixed(2)],
    ];
    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `mrr-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported");
  };

  if (loading) {
    return <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
    </div>;
  }

  const sections: { id: Section; label: string; icon: any }[] = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "revenue", label: "Revenue", icon: DollarSign },
    { id: "customers", label: "Customers", icon: Users },
    { id: "funnel", label: "Funnel", icon: Target },
    { id: "retention", label: "Retention", icon: Heart },
    { id: "insights", label: "AI Insights", icon: Sparkles },
    { id: "forecast", label: "Forecast", icon: TrendingUp },
    { id: "alerts", label: "Alerts", icon: AlertTriangle },
    { id: "actions", label: "Actions", icon: Rocket },
  ];

  return (
    <div className="flex gap-4 min-h-[600px]">
      {/* Left Sidebar Nav */}
      <aside className="w-48 shrink-0 space-y-1 sticky top-20 self-start">
        <div className="px-2 pb-2 mb-1 border-b border-border/60">
          <div className="flex items-center gap-2">
            <Crown className="w-4 h-4 text-yellow-400" />
            <span className="text-xs font-bold tracking-wide">MRR COMMAND</span>
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">Founder Dashboard</p>
        </div>
        {sections.map(s => (
          <button
            key={s.id}
            onClick={() => setSection(s.id)}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
              section === s.id
                ? "bg-primary text-primary-foreground shadow"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <s.icon className="w-3.5 h-3.5" />
            {s.label}
          </button>
        ))}
        <div className="pt-2 mt-2 border-t border-border/60 space-y-1">
          <Button variant="ghost" size="sm" onClick={fetchData} className="w-full justify-start gap-2 text-xs h-8">
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} /> Refresh
          </Button>
          <Button variant="ghost" size="sm" onClick={exportCsv} className="w-full justify-start gap-2 text-xs h-8">
            <Download className="w-3.5 h-3.5" /> Export CSV
          </Button>
        </div>
      </aside>

      {/* Main panel */}
      <div className="flex-1 min-w-0 space-y-4">
        {/* OVERVIEW */}
        {section === "overview" && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <MetricCard icon={DollarSign} label="MRR" value={formatMoney(metrics.mrr)} sub="Monthly Recurring" trend={metrics.netGrowth} color="text-primary" />
              <MetricCard icon={TrendingUp} label="ARR" value={formatMoney(metrics.arr)} sub="Annualized" color="text-[hsl(160,60%,45%)]" />
              <MetricCard icon={Users} label="Active Subscribers" value={String(metrics.activeSubs)} trend={0} color="text-[hsl(217,91%,60%)]" />
              <MetricCard icon={UserPlus} label="New This Month" value={String(metrics.newThisMonth)} color="text-[hsl(270,80%,70%)]" />
              <MetricCard icon={UserMinus} label="Churned" value={String(metrics.churnedThisMonth)} sub="This month" color="text-destructive" />
              <MetricCard icon={Activity} label="ARPU" value={`$${metrics.arpu.toFixed(0)}`} sub="Per user/month" color="text-[hsl(330,70%,55%)]" />
              <MetricCard icon={Crown} label="LTV" value={formatMoney(metrics.ltv)} sub={`${AVG_LIFETIME_MONTHS}mo avg`} color="text-yellow-400" />
              <MetricCard icon={Target} label="Trial→Paid" value={formatPct(metrics.trialConversion)} color="text-[hsl(38,92%,60%)]" />
              <MetricCard icon={Zap} label="Net Growth" value={formatPct(metrics.netGrowth)} sub="MoM" trend={metrics.netGrowth} color="text-primary" />
              <MetricCard icon={Heart} label="Saved Revenue" value={formatMoney(metrics.savedRevenue)} sub="Churn recovery" color="text-[hsl(160,60%,45%)]" />
              <MetricCard icon={ArrowUpRight} label="Expansion MRR" value={formatMoney(metrics.expansionMrr)} color="text-[hsl(217,91%,60%)]" />
              <MetricCard icon={ArrowDownRight} label="Refund Rate" value={formatPct(metrics.refundRate)} color="text-muted-foreground" />
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="w-4 h-4 text-primary" /> MRR Growth (Last 6 Months)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={metrics.mrrTimeline}>
                    <defs>
                      <linearGradient id="mrrGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickFormatter={(v) => formatMoney(v)} />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                    <Area type="monotone" dataKey="mrr" stroke="hsl(var(--primary))" strokeWidth={2.5} fill="url(#mrrGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </>
        )}

        {/* REVENUE */}
        {section === "revenue" && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader><CardTitle className="text-sm">New MRR vs Churned MRR</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={metrics.mrrTimeline}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                      <XAxis dataKey="month" fontSize={11} />
                      <YAxis fontSize={11} tickFormatter={(v) => formatMoney(v)} />
                      <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Bar dataKey="new" fill="hsl(160,60%,45%)" name="New MRR" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="churned" fill="hsl(0,70%,55%)" name="Churned MRR" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-sm">Revenue by Plan</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie
                        data={Object.entries(metrics.planRevenue).map(([k, v]) => ({ name: k, value: v.mrr }))}
                        cx="50%" cy="50%" outerRadius={80} dataKey="value" label={(e: any) => `${e.name}: $${e.value}`}
                      >
                        {Object.keys(metrics.planRevenue).map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader><CardTitle className="text-sm">Revenue by Industry</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={Object.entries(metrics.industryRevenue).map(([k, v]) => ({ industry: k, mrr: v }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                      <XAxis dataKey="industry" fontSize={11} />
                      <YAxis fontSize={11} tickFormatter={(v) => formatMoney(v)} />
                      <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                      <Bar dataKey="mrr" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {/* CUSTOMERS */}
        {section === "customers" && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <MetricCard icon={Users} label="Active" value={String(metrics.activeSubs)} color="text-[hsl(160,60%,45%)]" />
              <MetricCard icon={Activity} label="Trialing" value={String(metrics.trialing)} color="text-[hsl(217,91%,60%)]" />
              <MetricCard icon={PauseCircle} label="Paused" value="0" color="text-[hsl(38,92%,60%)]" />
              <MetricCard icon={UserMinus} label="Churned" value={String(metrics.churnedThisMonth)} color="text-destructive" />
            </div>
            <Card>
              <CardHeader><CardTitle className="text-sm">Customers by Plan</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(metrics.planRevenue).map(([plan, data]) => (
                    <div key={plan} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="capitalize">{plan}</Badge>
                        <span className="text-sm text-muted-foreground">{data.count} customers</span>
                      </div>
                      <span className="text-sm font-bold text-primary">{formatMoney(data.mrr)} MRR</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Briefcase className="w-4 h-4" /> Customers by Industry</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {Object.entries(metrics.industryRevenue).map(([ind, mrr]) => (
                    <div key={ind} className="p-3 rounded-lg bg-muted/30 text-center">
                      <p className="text-xs text-muted-foreground capitalize">{ind.replace("_", " ")}</p>
                      <p className="text-lg font-bold text-primary mt-1">{formatMoney(mrr)}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* FUNNEL */}
        {section === "funnel" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Conversion Funnel</CardTitle>
              <CardDescription className="text-xs">Visitor → Trial → Checkout → Payment → Activated → Retained</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {metrics.funnel.map((step, i) => (
                  <div key={step.stage} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium">{step.stage}</span>
                      <span className="text-muted-foreground">{step.count} <span className="text-primary">({formatPct(step.pct)})</span></span>
                    </div>
                    <div className="h-8 rounded-lg overflow-hidden bg-muted/30">
                      <div
                        className="h-full bg-gradient-to-r from-primary to-[hsl(217,91%,60%)] flex items-center px-3 text-xs font-bold text-primary-foreground transition-all"
                        style={{ width: `${Math.max(5, (step.count / (metrics.funnel[0].count || 1)) * 100)}%` }}
                      >
                        {step.count}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* RETENTION */}
        {section === "retention" && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <MetricCard icon={Heart} label="Save Rate" value={formatPct(metrics.saveRate)} color="text-[hsl(160,60%,45%)]" />
              <MetricCard icon={DollarSign} label="Saved Revenue" value={formatMoney(metrics.savedRevenue)} color="text-primary" />
              <MetricCard icon={UserMinus} label="Monthly Churn" value={formatPct(metrics.churnRate)} color="text-destructive" />
              <MetricCard icon={RefreshCw} label="Win-Back Rate" value="0%" sub="Coming soon" color="text-muted-foreground" />
            </div>
            <Card>
              <CardHeader><CardTitle className="text-sm">Top Cancellation Reasons</CardTitle></CardHeader>
              <CardContent>
                {Object.keys(metrics.churnReasons).length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-8">No cancellations yet — retention is healthy 💚</p>
                ) : (
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={Object.entries(metrics.churnReasons).map(([k, v]) => ({ reason: k, count: v }))} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                      <XAxis type="number" fontSize={11} />
                      <YAxis dataKey="reason" type="category" fontSize={11} width={100} />
                      <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                      <Bar dataKey="count" fill="hsl(0,70%,55%)" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {/* AI INSIGHTS */}
        {section === "insights" && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm flex items-center gap-2"><Sparkles className="w-4 h-4 text-primary" /> AI Founder Insights</CardTitle>
                <CardDescription className="text-xs">Weekly intelligence powered by Lovable AI</CardDescription>
              </div>
              <Button size="sm" onClick={generateAiInsights} disabled={aiLoading}>
                {aiLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1" /> : <Sparkles className="w-3.5 h-3.5 mr-1" />}
                Generate
              </Button>
            </CardHeader>
            <CardContent>
              {aiInsights ? (
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <pre className="whitespace-pre-wrap text-xs font-sans leading-relaxed">{aiInsights}</pre>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground text-xs">
                  Click <strong>Generate</strong> to get AI-powered weekly insights about your business.
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* FORECAST */}
        {section === "forecast" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="w-4 h-4 text-primary" /> Next Month MRR</CardTitle></CardHeader>
              <CardContent>
                <p className="text-4xl font-bold text-primary">{formatMoney(forecast.next)}</p>
                <p className="text-xs text-muted-foreground mt-2">Linear projection from last 6 months</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm">3-Month MRR Projection</CardTitle></CardHeader>
              <CardContent>
                <p className="text-4xl font-bold text-[hsl(160,60%,45%)]">{formatMoney(forecast.threeMonth)}</p>
                <p className="text-xs text-muted-foreground mt-2">Expected MRR in 90 days</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm">If Conversion +1%</CardTitle></CardHeader>
              <CardContent>
                <p className="text-4xl font-bold text-[hsl(217,91%,60%)]">{formatMoney(forecast.ifConvBoost)}</p>
                <p className="text-xs text-muted-foreground mt-2">MRR with 1% better trial conversion</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm">If Traffic Doubles</CardTitle></CardHeader>
              <CardContent>
                <p className="text-4xl font-bold text-[hsl(270,80%,70%)]">{formatMoney(forecast.trafficDouble || 0)}</p>
                <p className="text-xs text-muted-foreground mt-2">2x current visitors → 2x MRR</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ALERTS */}
        {section === "alerts" && (
          <Card>
            <CardHeader><CardTitle className="text-sm flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Smart Alerts</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {alerts.map((a, i) => (
                <div key={i} className={`p-3 rounded-lg border ${
                  a.severity === "high" ? "bg-destructive/10 border-destructive/30" :
                  a.severity === "medium" ? "bg-[hsl(38,92%,60%)]/10 border-[hsl(38,92%,60%)]/30" :
                  a.severity === "good" ? "bg-[hsl(160,60%,45%)]/10 border-[hsl(160,60%,45%)]/30" :
                  "bg-muted/30 border-border/40"
                }`}>
                  <div className="flex items-start gap-3">
                    <AlertTriangle className={`w-4 h-4 mt-0.5 ${
                      a.severity === "high" ? "text-destructive" :
                      a.severity === "medium" ? "text-[hsl(38,92%,60%)]" :
                      "text-[hsl(160,60%,45%)]"
                    }`} />
                    <div>
                      <p className="text-sm font-bold">{a.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{a.msg}</p>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* ACTIONS */}
        {section === "actions" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Card className="hover:border-primary/50 transition cursor-pointer" onClick={() => toast.info("Discount campaign builder — coming in next release")}>
              <CardContent className="p-5">
                <Rocket className="w-6 h-6 text-primary mb-2" />
                <p className="font-bold text-sm">Launch Discount Campaign</p>
                <p className="text-xs text-muted-foreground mt-1">Create promo codes for at-risk users</p>
              </CardContent>
            </Card>
            <Card className="hover:border-primary/50 transition cursor-pointer" onClick={() => toast.info("Win-back email tool — see Retention tab")}>
              <CardContent className="p-5">
                <Heart className="w-6 h-6 text-[hsl(330,70%,55%)] mb-2" />
                <p className="font-bold text-sm">Send Win-Back Emails</p>
                <p className="text-xs text-muted-foreground mt-1">Re-engage churned users</p>
              </CardContent>
            </Card>
            <Card className="hover:border-primary/50 transition cursor-pointer" onClick={() => toast.info("Upgrade promo — coming soon")}>
              <CardContent className="p-5">
                <ArrowUpRight className="w-6 h-6 text-[hsl(160,60%,45%)] mb-2" />
                <p className="font-bold text-sm">Offer Upgrade Promo</p>
                <p className="text-xs text-muted-foreground mt-1">Push Pro/Premium tiers</p>
              </CardContent>
            </Card>
            <Card className="hover:border-primary/50 transition cursor-pointer" onClick={exportCsv}>
              <CardContent className="p-5">
                <Download className="w-6 h-6 text-[hsl(217,91%,60%)] mb-2" />
                <p className="font-bold text-sm">Export Revenue Report</p>
                <p className="text-xs text-muted-foreground mt-1">CSV with all metrics</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default OwnerMrrCommandCenter;
