import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, TrendingUp, TrendingDown, Crown, AlertTriangle, Activity } from "lucide-react";
import { INDUSTRY_CONFIGS, type IndustryType } from "@/lib/industryConfig";

const PLAN_PRICES: Record<string, number> = { basic: 25, pro: 55, premium: 110, trial: 0 };

interface IndustryRow {
  industry: IndustryType;
  label: string;
  icon: string;
  color: string;
  totalUsers: number;
  active: number;
  trialing: number;
  churned: number;
  mrr: number;
  trialToPaidPct: number;
  churnPct: number;
}

export default function OwnerGrowthCommandCenter() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [rows, setRows] = useState<IndustryRow[]>([]);
  const [global, setGlobal] = useState({
    mrr: 0, arr: 0, active: 0, trialing: 0,
    trialToPaidPct: 0, churnPct: 0, netGrowthPct: 0, arpu: 0,
  });

  const load = async () => {
    setRefreshing(true);
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const [profilesRes, subsRes, cancelsRes] = await Promise.all([
      supabase.from("profiles").select("user_id, industry, created_at"),
      supabase.from("subscriptions").select("user_id, plan, status, is_lifetime, created_at"),
      supabase.from("cancellation_requests").select("user_id, created_at, final_action").gte("created_at", since),
    ]);

    const profiles = profilesRes.data || [];
    const subs = subsRes.data || [];
    const cancels = cancelsRes.data || [];

    const subByUser = new Map<string, any>();
    subs.forEach((s: any) => subByUser.set(s.user_id, s));

    const industries = Object.keys(INDUSTRY_CONFIGS) as IndustryType[];
    const out: IndustryRow[] = industries.map((ind) => {
      const cfg = INDUSTRY_CONFIGS[ind];
      const indProfiles = profiles.filter((p: any) => p.industry === ind);
      const userIds = new Set(indProfiles.map((p: any) => p.user_id));
      const indSubs = subs.filter((s: any) => userIds.has(s.user_id));
      const active = indSubs.filter((s: any) => s.status === "active" || s.is_lifetime).length;
      const trialing = indSubs.filter((s: any) => s.status === "trialing").length;
      const indCancels = cancels.filter((c: any) => userIds.has(c.user_id) && c.final_action === "cancel").length;
      const mrr = indSubs
        .filter((s: any) => s.status === "active" && !s.is_lifetime)
        .reduce((sum: number, s: any) => sum + (PLAN_PRICES[s.plan] || 0), 0);

      const totalTrialPlusActive = trialing + active;
      const trialToPaidPct = totalTrialPlusActive > 0 ? (active / totalTrialPlusActive) * 100 : 0;
      const churnPct = active + indCancels > 0 ? (indCancels / (active + indCancels)) * 100 : 0;

      return {
        industry: ind,
        label: cfg.label,
        icon: cfg.icon,
        color: cfg.color,
        totalUsers: indProfiles.length,
        active,
        trialing,
        churned: indCancels,
        mrr,
        trialToPaidPct,
        churnPct,
      };
    });

    const totalMrr = out.reduce((s, r) => s + r.mrr, 0);
    const totalActive = out.reduce((s, r) => s + r.active, 0);
    const totalTrialing = out.reduce((s, r) => s + r.trialing, 0);
    const totalChurned = out.reduce((s, r) => s + r.churned, 0);
    const trialToPaidPct = totalActive + totalTrialing > 0 ? (totalActive / (totalActive + totalTrialing)) * 100 : 0;
    const churnPct = totalActive + totalChurned > 0 ? (totalChurned / (totalActive + totalChurned)) * 100 : 0;
    const arpu = totalActive > 0 ? totalMrr / totalActive : 0;

    // Net growth: new active subs in last 30d minus churn (rough)
    const since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const newActive = subs.filter((s: any) =>
      (s.status === "active" || s.is_lifetime) && new Date(s.created_at) > since30
    ).length;
    const netGrowthPct = totalActive > 0 ? ((newActive - totalChurned) / totalActive) * 100 : 0;

    setGlobal({
      mrr: totalMrr,
      arr: totalMrr * 12,
      active: totalActive,
      trialing: totalTrialing,
      trialToPaidPct,
      churnPct,
      netGrowthPct,
      arpu,
    });
    setRows(out.sort((a, b) => b.mrr - a.mrr));
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { load(); }, []);

  const best = useMemo(() => rows.find((r) => r.mrr > 0) || null, [rows]);
  const lowestConv = useMemo(() => {
    const withTrials = rows.filter((r) => r.trialing + r.active > 0);
    return withTrials.length ? withTrials.reduce((min, r) => r.trialToPaidPct < min.trialToPaidPct ? r : min) : null;
  }, [rows]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Activity className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const fmtMoney = (n: number) => `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  const fmtPct = (n: number) => `${n.toFixed(1)}%`;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Crown className="w-4 h-4 text-yellow-400" /> Industry Growth Command Center
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Live cross-industry metrics — all 8 industries, real data only
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={load} disabled={refreshing}>
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Global metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard label="Total MRR" value={fmtMoney(global.mrr)} accent="hsl(168, 70%, 38%)" />
        <MetricCard label="ARR" value={fmtMoney(global.arr)} accent="hsl(220, 80%, 55%)" />
        <MetricCard label="Active Subscribers" value={global.active.toLocaleString()} accent="hsl(160, 60%, 45%)" />
        <MetricCard label="Trialing" value={global.trialing.toLocaleString()} accent="hsl(45, 90%, 55%)" />
        <MetricCard label="Trial → Paid (30d)" value={fmtPct(global.trialToPaidPct)} accent="hsl(262, 60%, 55%)" />
        <MetricCard label="Global Churn (30d)" value={fmtPct(global.churnPct)} accent="hsl(356, 72%, 55%)" />
        <MetricCard label="Net Growth (30d)" value={fmtPct(global.netGrowthPct)} accent={global.netGrowthPct >= 0 ? "hsl(160, 60%, 45%)" : "hsl(356, 72%, 55%)"} />
        <MetricCard label="ARPU" value={fmtMoney(global.arpu)} accent="hsl(310, 60%, 50%)" />
      </div>

      {/* Best / Lowest */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {best && (
          <Card className="border-[hsl(160,60%,45%)]/30 bg-[hsl(160,60%,45%)]/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-[hsl(160,60%,45%)] flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5" /> Best Performing Industry
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-base font-bold">{best.icon} {best.label}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {fmtMoney(best.mrr)} MRR · {best.active} active · {fmtPct(best.trialToPaidPct)} conversion
              </p>
            </CardContent>
          </Card>
        )}
        {lowestConv && (
          <Card className="border-[hsl(45,90%,55%)]/30 bg-[hsl(45,90%,55%)]/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-[hsl(45,90%,55%)] flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" /> Lowest Conversion Industry
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-base font-bold">{lowestConv.icon} {lowestConv.label}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {fmtPct(lowestConv.trialToPaidPct)} trial→paid · {lowestConv.trialing} trialing now —
                consider targeted onboarding nudge.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Industry leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Industry Leaderboard (sorted by MRR)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground border-b text-xs">
                  <th className="pb-2 font-medium">Industry</th>
                  <th className="pb-2 font-medium text-right">Users</th>
                  <th className="pb-2 font-medium text-right">Active</th>
                  <th className="pb-2 font-medium text-right">Trialing</th>
                  <th className="pb-2 font-medium text-right">MRR</th>
                  <th className="pb-2 font-medium text-right">Trial→Paid</th>
                  <th className="pb-2 font-medium text-right">Churn</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.industry} className="border-b border-border/40">
                    <td className="py-2.5">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{r.icon}</span>
                        <span className="font-medium text-foreground text-xs">{r.label}</span>
                      </div>
                    </td>
                    <td className="py-2.5 text-right text-muted-foreground">{r.totalUsers}</td>
                    <td className="py-2.5 text-right">
                      <Badge variant="secondary" className="text-[10px]">{r.active}</Badge>
                    </td>
                    <td className="py-2.5 text-right text-muted-foreground">{r.trialing}</td>
                    <td className="py-2.5 text-right font-semibold text-foreground">{fmtMoney(r.mrr)}</td>
                    <td className="py-2.5 text-right">
                      <span className={r.trialToPaidPct >= 30 ? "text-[hsl(160,60%,45%)]" : "text-muted-foreground"}>
                        {fmtPct(r.trialToPaidPct)}
                      </span>
                    </td>
                    <td className="py-2.5 text-right">
                      <span className={r.churnPct > 5 ? "text-[hsl(356,72%,55%)] flex items-center justify-end gap-1" : "text-muted-foreground"}>
                        {r.churnPct > 5 && <TrendingDown className="w-3 h-3" />}
                        {fmtPct(r.churnPct)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function MetricCard({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <Card className="border-border/60">
      <CardContent className="p-3">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="text-xl font-bold mt-1" style={{ color: accent }}>{value}</p>
      </CardContent>
    </Card>
  );
}
