import { useEffect, useState } from "react";
import { replitCall } from "@/lib/replitApi";
import { ShieldCheck, Loader2, AlertTriangle, Clock } from "lucide-react";

type Issue = {
  id: number;
  status: string;
  issue_type: string;
  issue_summary: string;
  advisor_name: string;
  industry: string;
  revenue_risk_level: string;
  revenue_at_risk_amount: string | null;
  revenue_at_risk_currency: string;
  sla_ms_target: number;
  created_at: string;
  resolved_at: string | null;
  elapsed_ms: number | null;
};

function Countdown({ createdAt, slaMs }: { createdAt: string; slaMs: number }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const deadline = new Date(createdAt).getTime() + slaMs;
  const remaining = Math.max(0, deadline - now);
  const mins = Math.floor(remaining / 60000);
  const secs = Math.floor((remaining % 60000) / 1000);
  const overdue = remaining === 0;
  return (
    <span className={`text-xs tabular-nums font-mono ${overdue ? "text-red-500" : "text-primary"}`}>
      <Clock className="w-3 h-3 inline mr-1" />
      {overdue ? "OVERDUE" : `${mins}:${secs.toString().padStart(2, "0")}`}
    </span>
  );
}

export default function ResolutionHubPage() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const [a, s] = await Promise.all([
      replitCall<{ issues: Issue[] }>("/resolution-hub/issues/active", undefined, { method: "GET" }),
      replitCall("/resolution-hub/customer-stats", undefined, { method: "GET" }),
    ]);
    setIssues(a.data?.issues ?? []);
    setStats(s.data);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 15000);
    return () => clearInterval(id);
  }, []);

  const riskColor = (lvl: string) => ({
    critical: "bg-red-500/20 text-red-500 border-red-500/40",
    high: "bg-orange-500/20 text-orange-500 border-orange-500/40",
    medium: "bg-yellow-500/20 text-yellow-500 border-yellow-500/40",
    low: "bg-emerald-500/20 text-emerald-500 border-emerald-500/40",
  } as Record<string, string>)[lvl] || "bg-muted text-muted-foreground border-border";

  return (
    <div className="container max-w-6xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <ShieldCheck className="w-7 h-7 text-primary" /> AI Resolution Hub
        </h1>
        <p className="text-muted-foreground mt-1.5">Live issue tracking — your AI advisors resolve problems before they cost you revenue.</p>
      </div>

      {stats && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-6">
          {[
            { l: "AI Resolution Rate", v: `${stats.ai_resolution_rate ?? 0}%` },
            { l: "Avg Resolution", v: `${stats.avg_resolution_mins ?? 0} min` },
            { l: "Revenue Protected", v: `£${stats.total_revenue_protected ?? 0}` },
            { l: "Sherlock Escalations", v: stats.sherlock_escalations ?? 0 },
          ].map((k) => (
            <div key={k.l} className="p-4 rounded-2xl bg-card/40 backdrop-blur-xl border border-border/50">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">{k.l}</p>
              <p className="text-2xl font-bold mt-1">{k.v}</p>
            </div>
          ))}
        </div>
      )}

      <h2 className="text-lg font-bold mb-3">Active Issues ({issues.length})</h2>
      {loading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
      {!loading && issues.length === 0 && (
        <div className="p-12 text-center rounded-2xl bg-card/40 backdrop-blur-xl border border-border/50">
          <ShieldCheck className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No active issues. Your AI advisors are on standby.</p>
        </div>
      )}
      <div className="space-y-3">
        {issues.map((i) => (
          <div key={i.id} className="p-4 rounded-2xl bg-card/40 backdrop-blur-xl border border-border/50 flex items-start gap-4">
            <AlertTriangle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${i.issue_type === "critical" ? "text-red-500" : "text-yellow-500"}`} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="text-sm font-semibold">{i.advisor_name}</span>
                <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border ${riskColor(i.revenue_risk_level)}`}>
                  {i.revenue_risk_level} risk
                </span>
                {i.revenue_at_risk_amount && (
                  <span className="text-xs font-mono text-muted-foreground">
                    {i.revenue_at_risk_currency} {i.revenue_at_risk_amount}
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2">{i.issue_summary}</p>
              <div className="mt-2">
                <Countdown createdAt={i.created_at} slaMs={i.sla_ms_target} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}