import { useFounderMetrics } from "@/hooks/useFounderMetrics";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";

export default function Revenue() {
  const m = useFounderMetrics();
  const fmt = (n: number) => "£" + n.toLocaleString("en-GB");
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "MRR", value: fmt(m.mrrGbp) },
          { label: "ARR", value: fmt(m.arrGbp) },
          { label: "Avg Revenue / Customer", value: m.activeCustomers ? fmt(Math.round(m.mrrGbp / m.activeCustomers)) : "£0" },
        ].map((k) => (
          <div key={k.label} className="founder-card p-5">
            <div className="text-[var(--fos-muted)] text-[11px] uppercase tracking-wider">{k.label}</div>
            <div className="text-[var(--fos-text)] text-3xl font-bold tabular-nums mt-1">{k.value}</div>
          </div>
        ))}
      </div>
      <div className="founder-card p-6">
        <h3 className="text-[var(--fos-text)] font-semibold text-sm mb-4">Revenue Growth · Last 6 Months</h3>
        <div className="h-[340px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={m.revenueByMonth}>
              <defs>
                <linearGradient id="rev2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22D3EE" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#22D3EE" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--fos-border)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" stroke="var(--fos-muted)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--fos-muted)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => "£" + v} />
              <Tooltip contentStyle={{ background: "var(--fos-card)", border: "1px solid var(--fos-border)", borderRadius: 8 }} formatter={(v: any) => "£" + Number(v).toLocaleString()} />
              <Area type="monotone" dataKey="gbp" stroke="#22D3EE" strokeWidth={2} fill="url(#rev2)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
