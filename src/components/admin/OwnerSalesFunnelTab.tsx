import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Activity, TrendingDown, TrendingUp, ShoppingCart, AlertTriangle } from "lucide-react";

const PLAN_PRICES: Record<string, number> = { basic: 25, pro: 55, premium: 110 };

interface FunnelStage {
  label: string;
  count: number;
  pct: number;
  drop: number;
  color: string;
}

export default function OwnerSalesFunnelTab() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stages, setStages] = useState<FunnelStage[]>([]);
  const [rescue, setRescue] = useState({
    shown: 0,
    accepted: 0,
    dismissed: 0,
    recoveredRevenue: 0,
    abandonRate: 0,
  });
  const [recentLeaks, setRecentLeaks] = useState<{ stage: string; pct: number }[]>([]);

  const load = async () => {
    setRefreshing(true);
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const [profilesRes, subsRes, eventsRes] = await Promise.all([
      supabase.from("profiles").select("user_id, created_at").gte("created_at", since),
      supabase.from("subscriptions").select("user_id, plan, status, is_lifetime, created_at"),
      supabase.from("checkout_events").select("event_type, plan, user_id, created_at").gte("created_at", since),
    ]);

    const profiles = profilesRes.data || [];
    const subs = subsRes.data || [];
    const events = eventsRes.data || [];

    const signups = profiles.length;
    const trialing = subs.filter((s: any) => s.status === "trialing").length;
    const opened = events.filter((e: any) => e.event_type === "opened").length;
    const completed = events.filter((e: any) => e.event_type === "completed").length;
    const paid = subs.filter(
      (s: any) =>
        (s.status === "active" || s.is_lifetime) &&
        new Date(s.created_at) > new Date(since)
    ).length;

    // Visitors estimate: signups * 8 (industry avg signup conversion ~12%)
    // Honest: we don't track anonymous visitors yet, so we mark this as estimated
    const visitorsEstimated = Math.max(signups * 8, opened * 4);

    const pct = (a: number, b: number) => (b > 0 ? (a / b) * 100 : 0);

    const built: FunnelStage[] = [
      { label: "Visitors (est.)", count: visitorsEstimated, pct: 100, drop: 0, color: "hsl(220, 80%, 55%)" },
      { label: "Signups", count: signups, pct: pct(signups, visitorsEstimated), drop: visitorsEstimated - signups, color: "hsl(168, 70%, 38%)" },
      { label: "Trial Started", count: trialing + paid, pct: pct(trialing + paid, signups), drop: signups - (trialing + paid), color: "hsl(262, 60%, 55%)" },
      { label: "Checkout Opened", count: opened, pct: pct(opened, trialing + paid), drop: Math.max((trialing + paid) - opened, 0), color: "hsl(45, 90%, 55%)" },
      { label: "Checkout Completed", count: completed, pct: pct(completed, opened), drop: opened - completed, color: "hsl(310, 60%, 50%)" },
      { label: "Paid (active)", count: paid, pct: pct(paid, completed || opened), drop: Math.max(completed - paid, 0), color: "hsl(160, 60%, 45%)" },
    ];

    setStages(built);

    // Detect leaks (>50% drop between stages)
    const leaks = built.slice(1).map((s, i) => {
      const prev = built[i];
      const dropPct = prev.count > 0 ? ((prev.count - s.count) / prev.count) * 100 : 0;
      return { stage: `${prev.label} → ${s.label}`, pct: dropPct };
    }).filter((l) => l.pct > 50).sort((a, b) => b.pct - a.pct);
    setRecentLeaks(leaks);

    // Rescue stats
    const shown = events.filter((e: any) => e.event_type === "rescue_shown").length;
    const accepted = events.filter((e: any) => e.event_type === "rescued").length;
    const dismissed = events.filter((e: any) => e.event_type === "rescue_dismissed").length;
    const abandoned = opened - completed;
    const abandonRate = opened > 0 ? (abandoned / opened) * 100 : 0;

    // Recovered revenue: 80% of "rescued" events convert to paid (industry avg)
    // We measure conservatively: rescued users that ALSO completed checkout in same session
    const rescuedSessions = new Set(
      events.filter((e: any) => e.event_type === "rescued").map((e: any) => `${e.user_id}_${e.created_at?.slice(0, 10)}`)
    );
    let recoveredRevenue = 0;
    events.filter((e: any) => e.event_type === "completed").forEach((e: any) => {
      const key = `${e.user_id}_${e.created_at?.slice(0, 10)}`;
      if (rescuedSessions.has(key)) {
        recoveredRevenue += (PLAN_PRICES[e.plan as string] || 0) * 0.8; // 20% discount applied
      }
    });

    setRescue({ shown, accepted, dismissed, recoveredRevenue, abandonRate });
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { load(); }, []);

  if (loading) {
    return <div className="flex items-center justify-center py-16"><Activity className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  const fmtMoney = (n: number) => `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  const fmtPct = (n: number) => `${n.toFixed(1)}%`;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 text-primary" /> Sales Conversion Funnel
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Real funnel data — last 30 days. Visitors are estimated until web analytics is connected.
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={load} disabled={refreshing}>
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Funnel visualization */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Conversion Funnel</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {stages.map((s, i) => {
            const widthPct = stages[0].count > 0 ? Math.max((s.count / stages[0].count) * 100, 5) : 5;
            return (
              <div key={s.label} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium">{i + 1}. {s.label}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground">{s.count.toLocaleString()} users</span>
                    <Badge variant="secondary" className="text-[10px]">{fmtPct(s.pct)}</Badge>
                  </div>
                </div>
                <div className="h-8 rounded-md bg-muted/30 overflow-hidden relative">
                  <div
                    className="h-full transition-all duration-500"
                    style={{ width: `${widthPct}%`, background: s.color }}
                  />
                </div>
                {i > 0 && s.drop > 0 && (
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1 pl-1">
                    <TrendingDown className="w-2.5 h-2.5 text-[hsl(356,72%,55%)]" />
                    {s.drop.toLocaleString()} dropped from previous stage
                  </p>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Leaks detected */}
      {recentLeaks.length > 0 && (
        <Card className="border-[hsl(45,90%,55%)]/30 bg-[hsl(45,90%,55%)]/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-[hsl(45,90%,55%)] flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" /> Leaks Detected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1.5 text-xs">
              {recentLeaks.map((l) => (
                <li key={l.stage} className="flex items-center justify-between">
                  <span>{l.stage}</span>
                  <Badge variant="destructive" className="text-[10px]">{fmtPct(l.pct)} drop</Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Checkout Rescue stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[hsl(160,60%,45%)]" />
              Smart Checkout Rescue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] uppercase text-muted-foreground">Popup Shown</p>
                <p className="text-xl font-bold">{rescue.shown}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase text-muted-foreground">Accepted</p>
                <p className="text-xl font-bold text-[hsl(160,60%,45%)]">{rescue.accepted}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase text-muted-foreground">Dismissed</p>
                <p className="text-xl font-bold text-muted-foreground">{rescue.dismissed}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase text-muted-foreground">Recovered MRR</p>
                <p className="text-xl font-bold text-primary">{fmtMoney(rescue.recoveredRevenue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-[hsl(45,90%,55%)]" />
              Checkout Health
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-xs">Abandon rate</span>
              <span className="font-bold">{fmtPct(rescue.abandonRate)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-xs">Acceptance rate</span>
              <span className="font-bold">
                {rescue.shown > 0 ? fmtPct((rescue.accepted / rescue.shown) * 100) : "—"}
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground pt-2 border-t border-border/40">
              Healthy benchmark: abandon rate &lt; 30%, rescue acceptance &gt; 15%.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
