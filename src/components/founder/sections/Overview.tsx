import { useFounderMetrics } from "@/hooks/useFounderMetrics";
import { TrendingUp, TrendingDown, Users, Target, Briefcase, Activity, AlertTriangle, Mail, Sparkles, CheckCircle2 } from "lucide-react";
import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Area, AreaChart } from "recharts";
import { useState } from "react";

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

  return (
    <div className="space-y-6">
      {/* ROW 1 — KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KpiCard icon={TrendingUp} label="MRR" value={fmt(m.mrrGbp)} delta={12} tone="success" />
        <KpiCard icon={Activity} label="ARR" value={fmt(m.arrGbp)} delta={18} tone="success" />
        <KpiCard icon={Users} label="Active Customers" value={m.activeCustomers} delta={8} />
        <KpiCard icon={Target} label="New Leads (24h)" value={m.newLeadsToday} delta={null} />
        <KpiCard icon={Briefcase} label="Open Deals" value={m.openDeals} delta={null} tone="warning" />
        <KpiCard icon={TrendingDown} label="Churn %" value={m.churnPct + "%"} delta={-2} tone={m.churnPct > 5 ? "danger" : "success"} />
      </div>

      {/* ROW 2 — Chart + AI Briefing */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="founder-card p-6 lg:col-span-2">
          <div className="flex items-start justify-between mb-5">
            <div>
              <h3 className="text-[var(--fos-text)] font-semibold text-sm">Revenue Growth</h3>
              <p className="text-[var(--fos-muted)] text-xs mt-0.5">Cumulative MRR · last 6 months · GBP</p>
            </div>
            <div className="text-right">
              <div className="text-[var(--fos-success)] text-xs font-semibold">+18.4%</div>
              <div className="text-[var(--fos-muted)] text-[10px]">vs prior 6mo</div>
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
              <div className="text-[var(--fos-warning)] font-semibold uppercase tracking-wider text-[10px] mb-1.5">⚠ Risks</div>
              <p className="text-[var(--fos-muted)] leading-relaxed">{m.churnPct}% churn detected. {m.failedPayments} payments failed in the last week — recovery flow recommended.</p>
            </div>
            <div>
              <div className="text-[var(--fos-success)] font-semibold uppercase tracking-wider text-[10px] mb-1.5">↑ Opportunities</div>
              <p className="text-[var(--fos-muted)] leading-relaxed">{m.newLeadsToday} new enterprise leads today. UK + UAE markets showing strongest signal.</p>
            </div>
            <div>
              <div className="text-[var(--fos-accent)] font-semibold uppercase tracking-wider text-[10px] mb-1.5">→ Recommended Actions</div>
              <ul className="text-[var(--fos-muted)] space-y-1 leading-relaxed">
                <li>• Personally email top 3 enterprise leads today</li>
                <li>• Approve pending win-back offers</li>
                <li>• Review pricing for Premium tier conversion</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* ROW 3 — Urgent rows */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="founder-card p-5 border-l-2 border-l-[var(--fos-danger)]">
          <div className="flex items-center gap-2 text-[var(--fos-danger)] text-xs font-semibold uppercase tracking-wider mb-2">
            <AlertTriangle className="w-3.5 h-3.5" /> Failed Payments
          </div>
          <div className="text-[var(--fos-text)] text-2xl font-bold tabular-nums">{m.failedPayments}</div>
          <div className="text-[var(--fos-muted)] text-xs mt-1">Recovery automation active</div>
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
