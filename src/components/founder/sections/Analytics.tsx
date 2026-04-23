import { useFounderMetrics } from "@/hooks/useFounderMetrics";
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

export default function Analytics() {
  const m = useFounderMetrics();
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="founder-card p-6">
        <h3 className="text-[var(--fos-text)] font-semibold text-sm mb-4">MRR by Month (Cumulative)</h3>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={m.revenueByMonth}>
              <CartesianGrid stroke="var(--fos-border)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" stroke="var(--fos-muted)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--fos-muted)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => "£" + v} />
              <Tooltip contentStyle={{ background: "var(--fos-card)", border: "1px solid var(--fos-border)", borderRadius: 8 }} formatter={(v: any) => "£" + Number(v).toLocaleString()} />
              <Bar dataKey="gbp" fill="#22D3EE" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="founder-card p-6">
        <h3 className="text-[var(--fos-text)] font-semibold text-sm mb-4">Snapshot</h3>
        <div className="space-y-3 text-sm">
          {[
            ["Active Customers", m.activeCustomers],
            ["Open Deals", m.openDeals],
            ["New Leads (24h)", m.newLeadsToday],
            ["Urgent Leads", m.urgentLeads],
            ["Failed Payments", m.failedPayments],
            ["Churn %", m.churnPct + "%"],
          ].map(([k, v]) => (
            <div key={k as string} className="flex items-center justify-between py-2 border-b border-[var(--fos-border)]/40">
              <span className="text-[var(--fos-muted)]">{k}</span>
              <span className="text-[var(--fos-text)] font-semibold tabular-nums">{v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
