import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiGet, ApiError } from "@/lib/api";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

type Stage =
  | "issue_received"
  | "ai_analyzing"
  | "recovery_engine"
  | "sherlock_reviewing"
  | "resolved";

type IssueStatus =
  | "active"
  | "sherlock_active"
  | "resolved"
  | string;

interface ResolutionIssue {
  id: string;
  status: IssueStatus;
  created_at: string;
  sla_ms_target: number;
  stages: Stage[];
  current_stage?: Stage;
  revenue_at_risk_amount: string | number | null;
  revenue_at_risk_currency: string | null;
  revenue_risk_level?: "low" | "medium" | "high" | "critical" | string | null;
  advisor_name?: string | null;
  industry?: string | null;
  title?: string | null;
  summary?: string | null;
}

const STEPS: { key: Stage; label: string }[] = [
  { key: "issue_received", label: "STEP 1: RECEIVED" },
  { key: "ai_analyzing", label: "STEP 2: ANALYZING" },
  { key: "recovery_engine", label: "STEP 3: RECOVERY ACTIVE" },
  { key: "sherlock_reviewing", label: "STEP 4: SHERLOCK REVIEWING" },
  { key: "resolved", label: "STEP 5: RESOLVED ✓" },
];

const CURRENCY_SYMBOL: Record<string, string> = {
  GBP: "£",
  USD: "$",
  EUR: "€",
  PKR: "₨",
};

function formatCurrency(amount: string | number, currency: string | null): string {
  const num = typeof amount === "string" ? Number(amount) : amount;
  if (!Number.isFinite(num)) return "";
  const symbol = currency ? CURRENCY_SYMBOL[currency] || "" : "";
  const formatted = num.toLocaleString("en-US");
  return `${symbol}${formatted} AT RISK`;
}

function formatMMSS(ms: number): string {
  const safe = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function getCircleColor(issue: ResolutionIssue, remainingMs: number): string {
  if (issue.status === "resolved") return "#16A34A";
  if (issue.status === "sherlock_active") return "#DC2626";
  if (remainingMs <= issue.sla_ms_target * 0.25) return "#FF6B00";
  return "#00FFFF";
}

function IssueCard({ issue }: { issue: ResolutionIssue }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const createdMs = new Date(issue.created_at).getTime();
  const remainingMs = issue.sla_ms_target - (now - createdMs);
  const color = getCircleColor(issue, remainingMs);

  const stageList = issue.stages?.length ? issue.stages : [issue.current_stage].filter(Boolean) as Stage[];
  const currentStage = issue.current_stage || stageList[stageList.length - 1];
  const currentIdx = STEPS.findIndex((s) => s.key === currentStage);

  const advisor = issue.advisor_name?.toUpperCase();
  const industryLabel = issue.industry
    ? issue.industry.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    : null;

  return (
    <div className="rounded-lg border border-border bg-card/50 p-4 space-y-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        {/* Pulse circle + timer */}
        <div className="flex items-center gap-3">
          <span
            className="relative inline-flex h-12 w-12 items-center justify-center rounded-full"
            style={{ backgroundColor: `${color}22` }}
          >
            <span
              className="absolute inline-flex h-full w-full rounded-full opacity-60 animate-ping"
              style={{ backgroundColor: color }}
            />
            <span
              className="relative inline-flex h-6 w-6 rounded-full"
              style={{ backgroundColor: color }}
            />
          </span>
          <div>
            <div className="font-mono text-2xl font-bold tabular-nums" style={{ color }}>
              {formatMMSS(remainingMs)}
            </div>
            {issue.title && <div className="text-sm text-muted-foreground">{issue.title}</div>}
          </div>
        </div>

        {/* Revenue gauge */}
        <div className="text-right">
          {issue.revenue_at_risk_amount != null ? (
            <div className="inline-flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-1.5 text-destructive">
              <AlertTriangle className="h-4 w-4" />
              <span className="font-bold">
                {formatCurrency(issue.revenue_at_risk_amount, issue.revenue_at_risk_currency)}
              </span>
            </div>
          ) : issue.revenue_risk_level ? (
            <Badge variant="outline" className="uppercase">
              {issue.revenue_risk_level} risk
            </Badge>
          ) : null}
          {advisor && (
            <div className="mt-2 text-xs text-muted-foreground">
              [{advisor}] {industryLabel ? `(${industryLabel})` : ""}
            </div>
          )}
        </div>
      </div>

      {/* Live progress steps */}
      <ol className="grid grid-cols-1 sm:grid-cols-5 gap-2">
        {STEPS.map((step, idx) => {
          const reached = currentIdx >= 0 && idx <= currentIdx;
          const isCurrent = idx === currentIdx;
          return (
            <li
              key={step.key}
              className={`rounded-md border px-2 py-1.5 text-[11px] font-semibold tracking-wide text-center ${
                reached
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-muted/30 text-muted-foreground"
              } ${isCurrent ? "ring-1 ring-primary" : ""}`}
            >
              {step.label}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export default function ResolutionHub() {
  const [issues, setIssues] = useState<ResolutionIssue[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const data = await apiGet<{ issues: ResolutionIssue[] } | ResolutionIssue[]>(
          "/resolution-hub/issues/active"
        );
        if (!alive) return;
        const list = Array.isArray(data) ? data : data?.issues ?? [];
        setIssues(list);
        setError(null);
      } catch (e) {
        if (!alive) return;
        if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
          setIssues([]);
          return;
        }
        setError(e instanceof Error ? e.message : "Failed to load");
      }
    };
    load();
    const id = setInterval(load, 15000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  if (issues === null && !error) return null;
  if (issues && issues.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            Resolution Hub
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          No active issues. All clear.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          Resolution Hub
          {issues && (
            <Badge variant="secondary" className="ml-1">
              {issues.length} active
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {error && <div className="text-sm text-destructive">{error}</div>}
        {issues?.map((issue) => (
          <IssueCard key={issue.id} issue={issue} />
        ))}
      </CardContent>
    </Card>
  );
}