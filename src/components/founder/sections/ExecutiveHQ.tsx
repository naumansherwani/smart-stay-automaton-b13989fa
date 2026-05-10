import { useEffect, useState } from "react";
import { useFounderMetrics } from "@/hooks/useFounderMetrics";
import { supabase } from "@/integrations/supabase/client";
import { invokeShim } from "@/lib/replitApi";
import { Crown, TrendingUp, TrendingDown, Users, Target, Briefcase, Mail, AlertTriangle, Sparkles, Activity, Globe2, Zap, FileText, RotateCcw, UserPlus, Plus, Loader2, Flame, Trophy, CalendarCheck } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { useAuth } from "@/hooks/useAuth";

const Kpi = ({ icon: Icon, label, value, tone = "default", hint }: any) => (
  <div className="founder-kpi">
    <div className="flex items-start justify-between">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
        tone === "gold" ? "bg-[#F59E0B]/15 text-[#F59E0B]" :
        tone === "success" ? "bg-[var(--fos-success)]/15 text-[var(--fos-success)]" :
        tone === "danger" ? "bg-[var(--fos-danger)]/15 text-[var(--fos-danger)]" :
        "bg-[var(--fos-accent)]/15 text-[var(--fos-accent)]"
      }`}>
        <Icon className="w-4 h-4" />
      </div>
      {hint && <span className="text-[10px] text-[var(--fos-muted)]">{hint}</span>}
    </div>
    <div className="mt-3 text-[10px] uppercase tracking-wider text-[var(--fos-muted)] font-semibold">{label}</div>
    <div className="text-[var(--fos-text)] text-2xl font-bold tabular-nums mt-1">{value}</div>
  </div>
);

const CmdBtn = ({ icon: Icon, label, onClick, accent }: any) => (
  <button onClick={onClick} className="founder-cmd-btn w-full justify-start" style={accent ? { borderColor: "rgba(34,211,238,0.4)" } : undefined}>
    <Icon className="w-3.5 h-3.5" /> {label}
  </button>
);

export default function ExecutiveHQ({ onNavigate }: { onNavigate?: (s: string) => void }) {
  const m = useFounderMetrics();
  const { user } = useAuth();
  const fmt = (n: number) => "£" + n.toLocaleString("en-GB");
  const fname = (user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Founder").split(" ")[0];

  const [brief, setBrief] = useState<{ risk: string; opportunity: string; country: string; plan: string; action: string } | null>(null);
  const [briefLoading, setBriefLoading] = useState(false);

  const [refunds, setRefunds] = useState<any[]>([]);
  const [vipLeads, setVipLeads] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [tasksDue, setTasksDue] = useState<any[]>([]);
  const [streak, setStreak] = useState<number>(1);
  const [winsThisMonth, setWinsThisMonth] = useState<{ deals: number; revenue: number; leads: number }>({ deals: 0, revenue: 0, leads: 0 });

  const loadBrief = async () => {
    setBriefLoading(true);
    try {
      const { data } = await invokeShim("founder-intelligence", {
        body: {
          mrr_gbp: m.mrrGbp, arr_gbp: m.arrGbp,
          active_customers: m.activeCustomers, trial_customers: m.trialCustomers,
          churn_pct: m.churnPct, open_deals: m.openDeals, urgent_leads: m.urgentLeads,
          failed_payments: m.failedPayments, refund_requests: m.refundRequests,
          revenue_by_plan: m.revenueByPlan, revenue_by_country: m.revenueByCountry,
        },
      });
      if (data?.brief) setBrief(data.brief);
    } catch {}
    finally { setBriefLoading(false); }
  };

  useEffect(() => {
    if (!m.loading) loadBrief();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [m.loading, m.mrrGbp, m.activeCustomers]);

  useEffect(() => {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
    Promise.all([
      supabase.from("payment_refunds").select("id,amount,status,reason,created_at").gte("created_at", sevenDaysAgo).limit(5),
      supabase.from("enterprise_leads").select("id,full_name,company_name,country,estimated_value_gbp,created_at").gte("created_at", sevenDaysAgo).order("created_at", { ascending: false }).limit(5),
      supabase.from("ent_deals").select("id,title,stage,value_gbp,created_at").in("stage", ["proposal", "negotiation"]).limit(5),
      supabase.from("crm_tasks").select("id,title,due_at,priority").lte("due_at", new Date(Date.now() + 24 * 3600 * 1000).toISOString()).limit(5),
    ]).then(([r, l, d, t]) => {
      setRefunds(r.data || []); setVipLeads(l.data || []); setContracts(d.data || []); setTasksDue(t.data || []);
    });
  }, []);

  // Founder login streak (localStorage, per-user)
  useEffect(() => {
    if (!user?.id) return;
    const key = `fos_streak_${user.id}`;
    const today = new Date().toISOString().slice(0, 10);
    try {
      const raw = localStorage.getItem(key);
      if (!raw) {
        localStorage.setItem(key, JSON.stringify({ last: today, count: 1 }));
        setStreak(1);
        return;
      }
      const { last, count } = JSON.parse(raw);
      if (last === today) { setStreak(count); return; }
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      const next = last === yesterday ? count + 1 : 1;
      localStorage.setItem(key, JSON.stringify({ last: today, count: next }));
      setStreak(next);
    } catch { setStreak(1); }
  }, [user?.id]);

  // Wins this month (deals won + new MRR + new leads)
  useEffect(() => {
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
    Promise.all([
      supabase.from("ent_deals").select("id,value_gbp,stage,updated_at").eq("stage", "won").gte("updated_at", monthStart),
      supabase.from("enterprise_leads").select("id").gte("created_at", monthStart),
    ]).then(([dealsRes, leadsRes]) => {
      const deals = dealsRes.data || [];
      const revenue = deals.reduce((s: number, d: any) => s + (d.value_gbp || 0), 0);
      setWinsThisMonth({ deals: deals.length, revenue, leads: (leadsRes.data || []).length });
    });
  }, []);

  const trendData = m.revenueByMonth.map((x) => ({ month: x.month, mrr: x.gbp }));

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="founder-luxe-card p-6 md:p-8 relative overflow-hidden">
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-[var(--fos-accent)]/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full bg-[#F59E0B]/8 blur-3xl pointer-events-none" />
        <div className="relative flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 text-[#F59E0B] text-[11px] uppercase tracking-[0.2em] font-semibold">
              <Crown className="w-3.5 h-3.5" /> Owner Command Center
            </div>
            <h1 className="text-[var(--fos-text)] text-3xl md:text-4xl font-bold mt-2 tracking-tight">
              Welcome back, <span className="bg-gradient-to-r from-[#F59E0B] via-[#FACC15] to-[#F59E0B] bg-clip-text text-transparent">{fname}</span>
            </h1>
            <p className="text-[var(--fos-muted)] text-sm mt-2 max-w-xl">You are operating a global AI software company. Here is everything that matters today — in one screen.</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-full bg-[var(--fos-success)]/10 border border-[var(--fos-success)]/30 text-[var(--fos-success)] text-[11px] font-semibold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--fos-success)] animate-pulse" /> All systems operational
            </span>
          </div>
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
          <Kpi icon={TrendingUp} label="Total MRR" value={fmt(m.mrrGbp)} tone="success" hint="now" />
          <Kpi icon={Activity} label="ARR" value={fmt(m.arrGbp)} tone="gold" />
          <Kpi icon={TrendingUp} label="Cash this month" value={fmt(m.mrrGbp)} hint="recurring" />
          <Kpi icon={Users} label="New customers" value={m.activeCustomers} />
          <Kpi icon={TrendingDown} label="Churn %" value={`${m.churnPct}%`} tone={m.churnPct > 5 ? "danger" : "success"} />
          <Kpi icon={Briefcase} label="Pipeline value" value={fmt(contracts.reduce((s, c) => s + (c.value_gbp || 0), 0))} />
          <Kpi icon={Target} label="Open ent. deals" value={m.openDeals} tone="gold" />
          <Kpi icon={Mail} label="Priority emails" value={m.emailsAwaitingReply} tone="danger" />
        </div>
      </div>

      {/* Founder Prestige Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="founder-luxe-card p-4 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#F59E0B] to-[#EF4444] flex items-center justify-center shrink-0 shadow-lg shadow-[#F59E0B]/20">
            <Flame className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-wider text-[var(--fos-muted)] font-semibold">Founder Streak</div>
            <div className="text-[var(--fos-text)] text-xl font-bold tabular-nums leading-tight">{streak} day{streak === 1 ? "" : "s"}</div>
            <div className="text-[10px] text-[var(--fos-muted)]">{streak >= 7 ? "On fire — keep going." : "Log in daily to grow."}</div>
          </div>
        </div>
        <div className="founder-luxe-card p-4 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#22D3EE] to-[#0EA5E9] flex items-center justify-center shrink-0 shadow-lg shadow-[#22D3EE]/20">
            <Trophy className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-wider text-[var(--fos-muted)] font-semibold">Wins This Month</div>
            <div className="text-[var(--fos-text)] text-xl font-bold tabular-nums leading-tight">{winsThisMonth.deals} deals · {fmt(winsThisMonth.revenue)}</div>
            <div className="text-[10px] text-[var(--fos-muted)]">{winsThisMonth.leads} new enterprise leads</div>
          </div>
        </div>
        <div className="founder-luxe-card p-4 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#10B981] to-[#22D3EE] flex items-center justify-center shrink-0 shadow-lg shadow-[#10B981]/20">
            <CalendarCheck className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-wider text-[var(--fos-muted)] font-semibold">Today's Focus</div>
            <div className="text-[var(--fos-text)] text-xl font-bold tabular-nums leading-tight">{tasksDue.length + vipLeads.length} actions</div>
            <div className="text-[10px] text-[var(--fos-muted)]">{tasksDue.length} tasks · {vipLeads.length} VIP leads</div>
          </div>
        </div>
      </div>

      {/* Chart + AI Brief */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 founder-luxe-card p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-[var(--fos-text)] font-semibold text-sm">Global Revenue</div>
              <div className="text-[var(--fos-muted)] text-[11px]">Cumulative MRR · last 6 months</div>
            </div>
            <div className="text-[var(--fos-accent)] text-[11px] font-semibold tabular-nums">{fmt(m.mrrGbp)}</div>
          </div>
          <div className="h-[220px]">
            <ResponsiveContainer>
              <AreaChart data={trendData} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="hqRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22D3EE" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="#22D3EE" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="2 4" stroke="rgba(148,163,184,0.15)" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} tickFormatter={(v) => `£${v}`} />
                <Tooltip contentStyle={{ background: "#111827", border: "1px solid #1F2937", borderRadius: 8, fontSize: 12 }} formatter={(v: any) => [fmt(v), "MRR"]} />
                <Area type="monotone" dataKey="mrr" stroke="#22D3EE" strokeWidth={2} fill="url(#hqRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="founder-luxe-card p-5 relative">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-[#F59E0B]" />
              <span className="text-[var(--fos-text)] font-semibold text-sm">Founder Intelligence</span>
            </div>
            <button onClick={loadBrief} disabled={briefLoading} className="text-[10px] text-[var(--fos-muted)] hover:text-[var(--fos-accent)]">
              {briefLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : "Refresh"}
            </button>
          </div>
          {briefLoading && !brief && <div className="text-[var(--fos-muted)] text-xs flex items-center gap-2"><Loader2 className="w-3 h-3 animate-spin" /> Analyzing your business…</div>}
          {brief && (
            <div className="space-y-2.5 text-xs">
              {[
                { label: "Biggest risk", v: brief.risk, c: "#EF4444", icon: AlertTriangle },
                { label: "Growth opportunity", v: brief.opportunity, c: "#10B981", icon: TrendingUp },
                { label: "Country rising", v: brief.country, c: "#22D3EE", icon: Globe2 },
                { label: "Plan to push", v: brief.plan, c: "#F59E0B", icon: Target },
                { label: "Action now", v: brief.action, c: "#A78BFA", icon: Zap },
              ].map((row) => (
                <div key={row.label} className="p-2.5 rounded-lg bg-[var(--fos-bg)]/60 border border-[var(--fos-border)]">
                  <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-wider font-semibold mb-0.5" style={{ color: row.c }}>
                    <row.icon className="w-3 h-3" /> {row.label}
                  </div>
                  <div className="text-[var(--fos-text)] leading-snug">{row.v || "—"}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Alert Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: "Failed Payments", count: m.failedPayments, items: refunds, icon: AlertTriangle, tone: "danger", emptyText: "No failures.", render: (r: any) => `£${r.amount} · ${r.reason || "n/a"}` },
          { title: "VIP Leads Waiting", count: vipLeads.length, items: vipLeads, icon: Users, tone: "gold", emptyText: "No new VIPs.", render: (l: any) => `${l.full_name} · ${l.company_name || l.country || ""}` },
          { title: "Contracts Pending", count: contracts.length, items: contracts, icon: FileText, tone: "accent", emptyText: "Pipeline clear.", render: (d: any) => `${d.title} · £${d.value_gbp || 0}` },
          { title: "Tasks Due Today", count: tasksDue.length, items: tasksDue, icon: Activity, tone: "default", emptyText: "Inbox zero.", render: (t: any) => t.title },
        ].map((p) => (
          <div key={p.title} className="founder-luxe-card p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                  p.tone === "danger" ? "bg-[var(--fos-danger)]/15 text-[var(--fos-danger)]" :
                  p.tone === "gold" ? "bg-[#F59E0B]/15 text-[#F59E0B]" :
                  p.tone === "accent" ? "bg-[var(--fos-accent)]/15 text-[var(--fos-accent)]" :
                  "bg-[var(--fos-muted)]/15 text-[var(--fos-muted)]"
                }`}><p.icon className="w-3.5 h-3.5" /></div>
                <span className="text-[var(--fos-text)] text-xs font-semibold">{p.title}</span>
              </div>
              <span className="text-[var(--fos-muted)] text-xs tabular-nums">{p.count}</span>
            </div>
            <div className="space-y-1.5 max-h-[120px] overflow-y-auto">
              {p.items.length === 0 && <div className="text-[var(--fos-muted)] text-[11px] italic">{p.emptyText}</div>}
              {p.items.slice(0, 4).map((it: any) => (
                <div key={it.id} className="text-[11px] text-[var(--fos-text)]/90 truncate border-b border-[var(--fos-border)]/40 pb-1">{p.render(it)}</div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Command Buttons */}
      <div className="founder-luxe-card p-5">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-3.5 h-3.5 text-[#F59E0B]" />
          <span className="text-[var(--fos-text)] font-semibold text-sm">Command Buttons</span>
          <span className="text-[var(--fos-muted)] text-[11px]">· One-click founder actions</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
          <CmdBtn icon={FileText} label="Send Invoice" onClick={() => onNavigate?.("crm")} />
          <CmdBtn icon={Mail} label="Reply Lead" accent onClick={() => onNavigate?.("emails")} />
          <CmdBtn icon={Sparkles} label="Launch Campaign" onClick={() => onNavigate?.("emails")} />
          <CmdBtn icon={RotateCcw} label="Review Churn" onClick={() => onNavigate?.("revenue")} />
          <CmdBtn icon={UserPlus} label="Add Team Member" onClick={() => onNavigate?.("settings")} />
          <CmdBtn icon={Plus} label="Create Deal" onClick={() => onNavigate?.("crm")} />
        </div>
      </div>
    </div>
  );
}
