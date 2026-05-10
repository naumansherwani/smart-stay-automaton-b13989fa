import { useEffect, useState } from "react";
import { replitCall } from "@/lib/replitApi";
import { TrendingUp, Loader2, Sparkles } from "lucide-react";
import AppLayout from "@/components/app/AppLayout";

export default function RevenueIntelligence() {
  const [report, setReport] = useState<any>(null);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      replitCall("/intelligence-reports/latest", undefined, { method: "GET" }),
      replitCall("/revenue-reports/summary", undefined, { method: "GET" }),
    ]).then(([r, s]) => {
      setReport(r.data);
      setSummary(s.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  return (
    <AppLayout>
    <div className="container max-w-6xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <TrendingUp className="w-7 h-7 text-primary" /> Revenue Intelligence
        </h1>
        <p className="text-muted-foreground mt-1.5">AI-generated monthly ROI reports + benchmark comparison.</p>
      </div>

      {loading && <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin" /> Loading reports…</div>}

      {summary && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-6">
          {[
            { label: "MRR", value: summary.mrr },
            { label: "ARR", value: summary.arr },
            { label: "Growth", value: summary.growth_pct ? `${summary.growth_pct}%` : "—" },
            { label: "Churn", value: summary.churn_rate ? `${summary.churn_rate}%` : "—" },
          ].map((k) => (
            <div key={k.label} className="p-4 rounded-2xl bg-card/40 backdrop-blur-xl border border-border/50">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">{k.label}</p>
              <p className="text-2xl font-bold mt-1">{k.value ?? "—"}</p>
            </div>
          ))}
        </div>
      )}

      {report && (
        <div className="p-6 rounded-2xl bg-card/40 backdrop-blur-xl border border-border/50">
          <h2 className="text-lg font-bold flex items-center gap-2 mb-3"><Sparkles className="w-4 h-4 text-primary" /> Latest Intelligence Report</h2>
          <pre className="text-xs whitespace-pre-wrap text-muted-foreground overflow-auto max-h-[600px]">
            {JSON.stringify(report, null, 2)}
          </pre>
        </div>
      )}

      {!loading && !report && !summary && (
        <div className="p-10 rounded-2xl bg-card/40 backdrop-blur-xl border border-border/50 text-center">
          <Sparkles className="w-8 h-8 text-primary mx-auto mb-3" />
          <h2 className="text-lg font-bold mb-1.5">No reports yet</h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Your first AI-generated revenue intelligence report will appear here once your account has activity to analyze.
          </p>
        </div>
      )}
    </div>
    </AppLayout>
  );
}