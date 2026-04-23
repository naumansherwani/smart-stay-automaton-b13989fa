import { useFounderMetrics } from "@/hooks/useFounderMetrics";
import { TrendingUp, TrendingDown, Users, Target, Briefcase, Activity, AlertTriangle, Mail, Sparkles, CheckCircle2, RefreshCw, Globe2, Layers } from "lucide-react";
import { ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Area, AreaChart, BarChart, Bar } from "recharts";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const KpiCard = ({ icon: Icon, label, value, delta, tone = "default" }: any) => (
  <div className="founder-card p-5 group hover:border-[var(--fos-accent)]/30 transition-all">
    <div className="flex items-start justify-between mb-3">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
        tone === "success" ? "bg-[var(--fos-success)]/10 text-[var(--fos-success)]" :
        tone === "warning" ? "bg-[var(--fos-warning)]/10 text-[var(--fos-warning)]" :
        tone === "danger" ? "bg-[var(--fos-danger)]/10 text-[var(--fos-danger)]" :
        "bg-[var(--fos-accent)]/10 text-[var(--fos-accent)]"
      }`}>
        <Icon className="w-4 h-4" />
      </div>
      {delta != null && (
        <span className={`text-[10px] font-semibold flex items-center gap-0.5 ${delta >= 0 ? "text-[var(--fos-success)]" : "text-[var(--fos-danger)]"}`}>
          {delta >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {Math.abs(delta)}%
        </span>
      )}
    </div>
    <div className="text-[var(--fos-muted)] text-[11px] uppercase tracking-wider font-medium">{label}</div>
    <div className="text-[var(--fos-text)] text-2xl font-bold tabular-nums mt-1">{value}</div>
  </div>
);

export default function Overview() {
  const m = useFounderMetrics();
  const fmt = (n: number) => "£" + n.toLocaleString("en-GB");
  const [tasks, setTasks] = useState([
    { id: 1, t: "Review enterprise pipeline", done: false },
    { id: 2, t: "Reply to top 3 urgent leads", done: false },
    { id: 3, t: "Approve win-back offers", done: true },
    { id: 4, t: "Check failed payment retries", done: false },
  ]);
  const [insights, setInsights] = useState<{ risk: string; opportunity: string; action: string; weekly: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await supabase.functions.invoke("founder-adviser", { body: { mode: "insights" } });
        if (!cancelled && data?.insights) setInsights(data.insights);
      } catch {}
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="space-y-6">
      {/* Status bar */}
      <div className="flex items-center justify-between">
        <div className="text-[11px] text-[var(--fos-muted)] flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--fos-success)] animate-pulse" />
          Live · auto-refresh every 60s
          {m.lastUpdated && <span className="opacity-60">· last sync {m.lastUpdated.toLocaleTimeString("en-GB")}</span>}
        </div>
        <button onClick={() => m.refresh()} className="text-[11px] text-[var(--fos-muted)] hover:text-[var(--fos-accent)] flex items-center gap-1">
          <RefreshCw className="w-3 h-3" /> Refresh
        </button>
      </div>

      {/* ROW 1 — KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KpiCard icon={TrendingUp} label="MRR" value={fmt(m.mrrGbp)} tone="success" />
        <KpiCard icon={Activity} label="ARR" value={fmt(m.arrGbp)} tone="success" />
        <KpiCard icon={Users} label="Active" value={m.activeCustomers} />
        <KpiCard icon={Target} label="Trials" value={m.trialCustomers} />
        <KpiCard icon={Briefcase} label="Open Deals" value={m.openDeals} tone="warning" />
        <KpiCard icon={TrendingDown} label="Churn %" value={m.churnPct + "%"} tone={m.churnPct > 5 ? "danger" : "success"} />
      </div>

      {/* ROW 2 — Chart + AI Briefing */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="founder-card p-6 lg:col-span-2">
          <div className="flex items-start justify-between mb-5">
            <div>
              <h3 className="text-[var(--fos-text)] font-semibold text-sm">Revenue Growth</h3>
              <p className="text-[var(--fos-muted)] text-xs mt-0.5">Cumulative MRR · last 6 months · GBP</p>
            </div>
          </div>
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={m.revenueByMonth}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22D3EE" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#22D3EE" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--fos-border)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" stroke="var(--fos-muted)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--fos-muted)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => "£" + v} />
                <Tooltip contentStyle={{ background: "var(--fos-card)", border: "1px solid var(--fos-border)", borderRadius: 8, fontSize: 12 }} formatter={(v: any) => "£" + Number(v).toLocaleString()} />
                <Area type="monotone" dataKey="gbp" stroke="#22D3EE" strokeWidth={2} fill="url(#rev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="founder-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-[var(--fos-accent)]" />
            <h3 className="text-[var(--fos-text)] font-semibold text-sm">Founder AI Briefing</h3>
          </div>
          <div className="space-y-4 text-xs">
            <div>
              <div className="text-[var(--fos-danger)] font-semibold uppercase tracking-wider text-[10px] mb-1.5">⚠ Risk</div>
              <p className="text-[var(--fos-muted)] leading-relaxed">{insights?.risk || `${m.churnPct}% churn · ${m.failedPayments} failed payments · ${m.refundRequests} refunds (30d).`}</p>
            </div>
            <div>
              <div className="text-[var(--fos-success)] font-semibold uppercase tracking-wider text-[10px] mb-1.5">↑ Opportunity</div>
              <p className="text-[var(--fos-muted)] leading-relaxed">{insights?.opportunity || `${m.newLeadsToday} new enterprise leads in 24h.`}</p>
            </div>
            <div>
              <div className="text-[var(--fos-accent)] font-semibold uppercase tracking-wider text-[10px] mb-1.5">→ Action</div>
              <p className="text-[var(--fos-muted)] leading-relaxed">{insights?.action || "Personally email top enterprise leads today."}</p>
            </div>
            <div>
              <div className="text-[#A78BFA] font-semibold uppercase tracking-wider text-[10px] mb-1.5">◇ Weekly Growth</div>
              <p className="text-[var(--fos-muted)] leading-relaxed">{insights?.weekly || "Live insight syncing…"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ROW 2.5 — Plan & Country breakdowns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="founder-card p-6">
          <div className="flex items-center gap-2 mb-4"><Layers className="w-4 h-4 text-[var(--fos-accent)]" /><h3 className="text-[var(--fos-text)] font-semibold text-sm">Revenue by Plan</h3></div>
          {m.revenueByPlan.length === 0 && <div className="text-xs text-[var(--fos-muted)] py-6 text-center">No active subscriptions yet.</div>}
          {m.revenueByPlan.length > 0 && (
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={m.revenueByPlan}>
                  <CartesianGrid stroke="var(--fos-border)" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="plan" stroke="var(--fos-muted)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--fos-muted)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => "£" + v} />
                  <Tooltip contentStyle={{ background: "var(--fos-card)", border: "1px solid var(--fos-border)", borderRadius: 8 }} formatter={(v: any) => "£" + Number(v).toLocaleString()} />
                  <Bar dataKey="gbp" fill="#22D3EE" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
        <div className="founder-card p-6">
          <div className="flex items-center gap-2 mb-4"><Globe2 className="w-4 h-4 text-[var(--fos-accent)]" /><h3 className="text-[var(--fos-text)] font-semibold text-sm">Top Countries (Enterprise Leads)</h3></div>
          {m.revenueByCountry.length === 0 && <div className="text-xs text-[var(--fos-muted)] py-6 text-center">No country data yet.</div>}
          {m.revenueByCountry.length > 0 && (
            <div className="space-y-2">
              {m.revenueByCountry.map((c) => (
                <div key={c.country} className="flex items-center gap-3">
                  <span className="text-xs text-[var(--fos-text)] w-32 truncate">{c.country}</span>
                  <div className="flex-1 h-2 rounded-full bg-[var(--fos-bg)] overflow-hidden">
                    <div className="h-full bg-[var(--fos-accent)]" style={{ width: `${Math.min(100, (c.leads / Math.max(1, m.revenueByCountry[0].leads)) * 100)}%` }} />
                  </div>
                  <span className="text-xs text-[var(--fos-muted)] tabular-nums w-10 text-right">{c.leads}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ROW 3 — Urgent rows */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="founder-card p-5 border-l-2 border-l-[var(--fos-danger)]">
          <div className="flex items-center gap-2 text-[var(--fos-danger)] text-xs font-semibold uppercase tracking-wider mb-2">
            <AlertTriangle className="w-3.5 h-3.5" /> Failed Payments
          </div>
          <div className="text-[var(--fos-text)] text-2xl font-bold tabular-nums">{m.failedPayments}</div>
          <div className="text-[var(--fos-muted)] text-xs mt-1">Recovery automation active</div>
        </div>
        <div className="founder-card p-5 border-l-2 border-l-[var(--fos-warning)]">
          <div className="flex items-center gap-2 text-[var(--fos-warning)] text-xs font-semibold uppercase tracking-wider mb-2">
            <Activity className="w-3.5 h-3.5" /> Refunds (30d)
          </div>
          <div className="text-[var(--fos-text)] text-2xl font-bold tabular-nums">{m.refundRequests}</div>
          <div className="text-[var(--fos-muted)] text-xs mt-1">Total in last month</div>
        </div>
        <div className="founder-card p-5 border-l-2 border-l-[var(--fos-warning)]">
          <div className="flex items-center gap-2 text-[var(--fos-warning)] text-xs font-semibold uppercase tracking-wider mb-2">
            <Target className="w-3.5 h-3.5" /> Urgent Leads
          </div>
          <div className="text-[var(--fos-text)] text-2xl font-bold tabular-nums">{m.urgentLeads}</div>
          <div className="text-[var(--fos-muted)] text-xs mt-1">Awaiting first response</div>
        </div>
        <div className="founder-card p-5 border-l-2 border-l-[var(--fos-accent)]">
          <div className="flex items-center gap-2 text-[var(--fos-accent)] text-xs font-semibold uppercase tracking-wider mb-2">
            <Mail className="w-3.5 h-3.5" /> Emails Awaiting Reply
          </div>
          <div className="text-[var(--fos-text)] text-2xl font-bold tabular-nums">{m.emailsAwaitingReply}</div>
          <div className="text-[var(--fos-muted)] text-xs mt-1">Within SLA window</div>
        </div>
      </div>

      {/* ROW 4 — Tasks board */}
      <div className="founder-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[var(--fos-text)] font-semibold text-sm">Today · Founder Tasks</h3>
          <span className="text-[var(--fos-muted)] text-xs">{tasks.filter(t => !t.done).length} open</span>
        </div>
        <div className="space-y-2">
          {tasks.map((task) => (
            <button
              key={task.id}
              onClick={() => setTasks(tasks.map(t => t.id === task.id ? { ...t, done: !t.done } : t))}
              className="w-full flex items-center gap-3 p-3 rounded-lg bg-[var(--fos-bg)] hover:bg-[var(--fos-border)]/30 border border-[var(--fos-border)]/50 text-left transition-colors group"
            >
              <CheckCircle2 className={`w-4 h-4 shrink-0 ${task.done ? "text-[var(--fos-success)]" : "text-[var(--fos-muted)]/50 group-hover:text-[var(--fos-accent)]"}`} />
              <span className={`text-sm flex-1 ${task.done ? "text-[var(--fos-muted)] line-through" : "text-[var(--fos-text)]"}`}>{task.t}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
