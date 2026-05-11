import { useEffect, useState, useCallback } from "react";
import { replitCall } from "@/lib/replitApi";
import {
  ShieldCheck,
  Loader2,
  AlertTriangle,
  Clock,
  CheckCircle2,
  X,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import AppLayout from "@/components/app/AppLayout";

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

type StageEntry = {
  stage: string;
  timestamp: string;
  message: string;
};

type Message = {
  id: number;
  role: string;
  content: string;
  created_at: string;
};

type IssueDetail = Issue & {
  stages?: StageEntry[];
  escalated_to_sherlock?: boolean;
  sherlock_review_at?: string | null;
};

function useTimer() {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

function timerState(issue: Issue, now: number) {
  const created = new Date(issue.created_at).getTime();
  const elapsed = now - created;
  const remaining = Math.max(0, issue.sla_ms_target - elapsed);
  const isResolved = issue.status === "resolved";
  const isSherlock = issue.status === "sherlock_active";
  const isWarning = elapsed >= issue.sla_ms_target * 0.75;
  const mins = Math.floor(remaining / 60000);
  const secs = Math.floor((remaining % 60000) / 1000);
  return {
    label: isResolved
      ? "RESOLVED"
      : remaining === 0
        ? "OVERDUE"
        : `${mins}:${secs.toString().padStart(2, "0")}`,
    color: isResolved
      ? "text-emerald-500"
      : isSherlock
        ? "text-red-500"
        : isWarning
          ? "text-orange-500"
          : "text-emerald-400",
    pulse: isResolved
      ? "bg-emerald-500"
      : isSherlock
        ? "bg-red-500"
        : isWarning
          ? "bg-orange-500"
          : "bg-emerald-400",
    isSherlock,
    isResolved,
  };
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: "bg-emerald-500/20 text-emerald-500 border-emerald-500/40",
    sherlock_active: "bg-red-500/20 text-red-500 border-red-500/40",
    resolved: "bg-muted text-muted-foreground border-border",
  };
  const label =
    status === "sherlock_active"
      ? "Sherlock Active"
      : status === "active"
        ? "Active"
        : status === "resolved"
          ? "Resolved"
          : status;
  return (
    <span
      className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border ${
        map[status] || "bg-muted text-muted-foreground border-border"
      }`}
    >
      {label}
    </span>
  );
}

function IssueRow({
  issue,
  onClick,
}: {
  issue: Issue;
  onClick: () => void;
}) {
  const now = useTimer();
  const t = timerState(issue, now);

  return (
    <button
      onClick={onClick}
      className="w-full text-left p-4 rounded-2xl bg-card/40 backdrop-blur-xl border border-border/50 hover:border-primary/40 transition flex items-start gap-4"
    >
      <div className="relative flex-shrink-0 mt-1">
        <span className={`absolute inline-flex h-3 w-3 rounded-full opacity-75 animate-ping ${t.pulse}`} />
        <span className={`relative inline-flex h-3 w-3 rounded-full ${t.pulse}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <span className="text-sm font-semibold">{issue.advisor_name}</span>
          <span className="text-xs text-muted-foreground">
            ({issue.industry?.replace(/_/g, " ")})
          </span>
          <StatusBadge status={issue.status} />
          {issue.revenue_at_risk_amount && (
            <span className="text-xs font-mono text-muted-foreground">
              {issue.revenue_at_risk_currency} {issue.revenue_at_risk_amount}
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2">{issue.issue_summary}</p>
        <div className="mt-2 flex items-center gap-3">
          <span className={`text-xs tabular-nums font-mono ${t.color}`}>
            <Clock className="w-3 h-3 inline mr-1" />
            {t.label}
          </span>
          {issue.issue_type === "critical" && (
            <span className="text-[10px] uppercase tracking-wider text-red-500">Critical</span>
          )}
        </div>
      </div>
      <AlertTriangle
        className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
          t.isSherlock ? "text-red-500" : t.isResolved ? "text-emerald-500" : "text-yellow-500"
        }`}
      />
    </button>
  );
}

// Sherlock Auto-Import Chain — 6 backend stages (BACKEND_API_BRIEF §4)
const STAGE_META: Record<string, { label: string; color: string; ring: string }> = {
  issue_received:      { label: "Customer message received",   color: "bg-cyan-500",     ring: "ring-cyan-500/30" },
  ai_analyzing:        { label: "Advisor analysis in progress", color: "bg-blue-500",     ring: "ring-blue-500/30" },
  analysis_completed:  { label: "Advisor analysis completed",   color: "bg-blue-500",     ring: "ring-blue-500/30" },
  sherlock_reviewing:  { label: "Sherlock reviewed",            color: "bg-orange-500",   ring: "ring-orange-500/30" },
  action_executed:     { label: "Auto-pricing action executed", color: "bg-amber-500",    ring: "ring-amber-500/30" },
  revenue_protected:   { label: "Revenue protected",            color: "bg-emerald-500",  ring: "ring-emerald-500/30" },
  resolved:            { label: "Issue resolved",               color: "bg-emerald-500",  ring: "ring-emerald-500/30" },
  // legacy fallbacks
  detected:            { label: "Detected",                     color: "bg-cyan-500",     ring: "ring-cyan-500/30" },
  recovery_engine:     { label: "Recovery engine",              color: "bg-amber-500",    ring: "ring-amber-500/30" },
};

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(diff) || diff < 0) return "just now";
  const s = Math.floor(diff / 1000);
  if (s < 5) return "just now";
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function IssueDrawer({
  issueId,
  onClose,
  onResolved,
}: {
  issueId: number | null;
  onClose: () => void;
  onResolved: () => void;
}) {
  const [detail, setDetail] = useState<IssueDetail | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [resolveOpen, setResolveOpen] = useState(false);
  const [note, setNote] = useState("");
  const [revenueProtected, setRevenueProtected] = useState("");
  const [resolving, setResolving] = useState(false);

  const load = useCallback(async () => {
    if (!issueId) return;
    setLoading(true);
    const res = await replitCall<{ issue: IssueDetail; messages: Message[] }>(
      `/resolution-hub/issues/${issueId}`,
      undefined,
      { method: "GET" },
    );
    setDetail(res.data?.issue ?? null);
    setMessages(res.data?.messages ?? []);
    setLoading(false);
  }, [issueId]);

  useEffect(() => {
    if (issueId) load();
  }, [issueId, load]);

  const handleResolve = async () => {
    if (!issueId) return;
    setResolving(true);
    const body: any = {};
    if (note.trim()) body.resolution_note = note.trim();
    if (revenueProtected.trim()) body.revenue_protected = Number(revenueProtected);
    const res = await replitCall(
      `/resolution-hub/issues/${issueId}/resolve`,
      body,
      { method: "PATCH" },
    );
    setResolving(false);
    if (res.error) {
      toast({ title: "Failed to resolve", description: res.error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Issue resolved", description: "Confirmation email sent." });
    setResolveOpen(false);
    setNote("");
    setRevenueProtected("");
    onResolved();
    onClose();
  };

  const open = issueId !== null;

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            Issue #{issueId}
          </SheetTitle>
          <SheetDescription>Live timeline & messages</SheetDescription>
        </SheetHeader>

        {loading && (
          <div className="py-12 flex justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        )}

        {detail && !loading && (
          <div className="mt-6 space-y-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold">{detail.advisor_name}</span>
                <span className="text-xs text-muted-foreground">
                  ({detail.industry?.replace(/_/g, " ")})
                </span>
                <StatusBadge status={detail.status} />
              </div>
              <p className="text-sm">{detail.issue_summary}</p>
              {detail.revenue_at_risk_amount && (
                <p className="text-xs font-mono text-muted-foreground">
                  Revenue at risk: {detail.revenue_at_risk_currency} {detail.revenue_at_risk_amount}
                </p>
              )}
            </div>

            {detail.stages && detail.stages.length > 0 && (
              <div>
                <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-3">
                  Sherlock Auto-Import Chain
                </h3>
                <ol className="space-y-3 border-l border-border/60 pl-4">
                  {detail.stages.map((s, i) => {
                    const meta = STAGE_META[s.stage] ?? {
                      label: s.stage,
                      color: "bg-primary",
                      ring: "ring-primary/30",
                    };
                    return (
                      <li key={i} className="relative">
                        <span
                          className={`absolute -left-[23px] top-1 w-3 h-3 rounded-full ${meta.color} ring-4 ${meta.ring}`}
                        />
                        <p className="text-sm font-medium">{meta.label}</p>
                        {s.message && (
                          <p className="text-xs text-muted-foreground">{s.message}</p>
                        )}
                        <p className="text-[10px] text-muted-foreground/70 mt-0.5">
                          {relativeTime(s.timestamp)}
                          <span className="mx-1.5 opacity-40">·</span>
                          {new Date(s.timestamp).toLocaleTimeString()}
                        </p>
                      </li>
                    );
                  })}
                </ol>
              </div>
            )}

            {messages.length > 0 && (
              <div>
                <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-3">
                  Messages
                </h3>
                <div className="space-y-2">
                  {messages.map((m) => (
                    <div
                      key={m.id}
                      className={`p-3 rounded-lg text-sm ${
                        m.role === "assistant"
                          ? "bg-primary/10 border border-primary/20"
                          : "bg-muted/40 border border-border/40"
                      }`}
                    >
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                        {m.role}
                      </p>
                      <p>{m.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {detail.status !== "resolved" && (
              <div className="pt-2 border-t border-border/40">
                <Button
                  className="w-full"
                  onClick={() => setResolveOpen(true)}
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Mark as Resolved
                </Button>
              </div>
            )}
          </div>
        )}

        <AlertDialog open={resolveOpen} onOpenChange={setResolveOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Resolve this issue?</AlertDialogTitle>
              <AlertDialogDescription>
                A confirmation email will be sent automatically.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-3">
              <div>
                <Label htmlFor="note">Resolution note (optional)</Label>
                <Textarea
                  id="note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="What was done?"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="rev">Revenue protected (optional)</Label>
                <Input
                  id="rev"
                  type="number"
                  value={revenueProtected}
                  onChange={(e) => setRevenueProtected(e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={resolving}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault();
                  handleResolve();
                }}
                disabled={resolving}
              >
                {resolving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Resolve"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </SheetContent>
    </Sheet>
  );
}

export default function ResolutionHubPage() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const load = useCallback(async () => {
    const [a, s] = await Promise.all([
      replitCall<{ issues: Issue[] }>("/resolution-hub/issues/active", undefined, { method: "GET" }),
      replitCall("/resolution-hub/customer-stats", undefined, { method: "GET" }),
    ]);
    setIssues(a.data?.issues ?? []);
    setStats(s.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 15000);
    return () => clearInterval(id);
  }, [load]);

  return (
    <AppLayout>
    <div className="container max-w-6xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <ShieldCheck className="w-7 h-7 text-primary" /> AI Resolution Hub
        </h1>
        <p className="text-muted-foreground mt-1.5">
          Live issue tracking — your AI advisors resolve problems before they cost you revenue.
        </p>
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
          <IssueRow key={i.id} issue={i} onClick={() => setSelectedId(i.id)} />
        ))}
      </div>

      <IssueDrawer
        issueId={selectedId}
        onClose={() => setSelectedId(null)}
        onResolved={load}
      />
    </div>
    </AppLayout>
  );
}