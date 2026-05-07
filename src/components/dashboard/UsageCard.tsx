import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Sparkles, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { fetchMyPlan, type PlanMeResponse } from "@/lib/api";
import { handleApiError } from "@/lib/handleApiError";

const PLAN_LABEL: Record<string, string> = {
  trial: "Trial",
  basic: "Basic",
  pro: "Pro",
  premium: "Premium",
  enterprise: "Enterprise",
};

/** Pull a numeric AI usage count out of whatever the backend exposes. */
function readAiUsage(me: PlanMeResponse | null): number {
  if (!me?.usage) return 0;
  const u = me.usage as Record<string, number>;
  return (
    u.ai_calls_month ??
    u.ai_messages_month ??
    u.monthly_ai_calls ??
    u.ai_calls ??
    u.ai_messages ??
    0
  );
}

/** Pull a numeric AI monthly cap; fall back to daily*30 if monthly missing. */
function readAiCap(me: PlanMeResponse | null): number | null {
  const ai = me?.limits?.ai as Record<string, number | null> | undefined;
  if (!ai) return null;
  const monthly =
    (ai.monthly_messages as number | null | undefined) ??
    (ai.monthly_cap as number | null | undefined) ??
    null;
  if (monthly !== undefined && monthly !== null) return monthly;
  if (typeof ai.daily_messages === "number") return ai.daily_messages * 30;
  return null;
}

export default function UsageCard() {
  const [me, setMe] = useState<PlanMeResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchMyPlan();
        if (!cancelled) setMe(data);
      } catch (e) {
        handleApiError(e, { silent: true });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (loading || !me) return null;

  const cap = readAiCap(me);
  const used = readAiUsage(me);
  const unlimited = cap === null;
  const pct = unlimited ? 0 : cap === 0 ? 100 : Math.min(100, Math.round((used / cap) * 100));

  let tone: "ok" | "warn" | "danger" = "ok";
  if (!unlimited) {
    if (pct >= 100) tone = "danger";
    else if (pct >= 80) tone = "warn";
  }

  const barClass =
    tone === "danger"
      ? "[&>div]:bg-destructive"
      : tone === "warn"
      ? "[&>div]:bg-amber-500"
      : "[&>div]:bg-emerald-500";

  return (
    <Card>
      <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Sparkles className="w-4 h-4 text-primary" />
          Usage
        </CardTitle>
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Plan: <span className="text-foreground">{PLAN_LABEL[me.plan] ?? me.plan}</span>
        </span>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>AI calls this month</span>
          <span className="tabular-nums font-medium text-foreground">
            {used.toLocaleString()} {unlimited ? "" : `/ ${cap!.toLocaleString()}`}
          </span>
        </div>
        <Progress value={unlimited ? 0 : pct} className={barClass} />
        {tone === "warn" && (
          <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" />
            You're nearing your AI limit.{" "}
            <Link to="/pricing" className="underline font-medium">Consider upgrading.</Link>
          </p>
        )}
        {tone === "danger" && (
          <div className="flex items-center justify-between gap-2 rounded-md bg-destructive/10 border border-destructive/30 px-3 py-2">
            <p className="text-xs text-destructive font-medium">
              AI limit reached. Upgrade to continue.
            </p>
            <Button asChild size="sm" variant="destructive">
              <Link to="/pricing">Upgrade</Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}