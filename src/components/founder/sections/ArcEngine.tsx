import { useEffect, useState, useCallback, useMemo } from "react";
import { Activity, Zap, Sparkles, AlertTriangle, CheckCircle2, XCircle, Loader2, RefreshCw, TrendingUp, TrendingDown, Heart, Mail, UserCheck, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

type Health = {
  user_id: string;
  industry: string | null;
  plan: string | null;
  health_score: number;
  usage_score: number;
  engagement_score: number;
  payment_health_score: number;
  lifecycle_phase: string;
  trial_day: number | null;
  feature_count_30d: number | null;
  recommended_action: string | null;
  recommended_action_reason: string | null;
  computed_at: string;
};
type ArcAction = {
  id: string;
  user_id: string;
  phase: string;
  action_type: string;
  channel: string;
  title: string;
  status: string;
  created_at: string;
};
type QueueItem = {
  id: string;
  proposed_by: string;
  target_user_id: string | null;
  action_type: string;
  title: string;
  description: string | null;
  ai_reasoning: string | null;
  risk_level: string;
  status: string;
  payload: any;
  created_at: string;
};

const PHASE_COLOR: Record<string, string> = {
  attract: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  convert: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  retain: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  recover: "bg-rose-500/15 text-rose-400 border-rose-500/30",
  champion: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
};

function healthColor(s: number) {
  if (s >= 80) return "text-emerald-400";
  if (s >= 60) return "text-cyan-400";
  if (s >= 40) return "text-amber-400";
  return "text-rose-400";
}

export default function ArcEngine() {
  const { user } = useAuth();
  const [tab, setTab] = useState<"overview" | "queue" | "actions" | "health">("overview");
  const [running, setRunning] = useState(false);
  const [health, setHealth] = useState<Health[]>([]);
  const [actions, setActions] = useState<ArcAction[]>([]);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [decideId, setDecideId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [{ data: h }, { data: a }, { data: q }] = await Promise.all([
      supabase.from("user_health_scores").select("*").order("health_score", { ascending: true }).limit(50),
      supabase.from("arc_actions").select("*").order("created_at", { ascending: false }).limit(50),
      supabase.from("founder_action_queue").select("*").eq("founder_id", user?.id ?? "").order("created_at", { ascending: false }).limit(50),
    ]);
    setHealth((h as Health[]) ?? []);
    setActions((a as ArcAction[]) ?? []);
    setQueue((q as QueueItem[]) ?? []);
  }, [user?.id]);

  useEffect(() => { if (user) load(); }, [user, load]);

  const runOrchestrator = async () => {
    setRunning(true);
    try {
      const { data, error } = await supabase.functions.invoke("arc-orchestrator", { body: { trigger: "manual" } });
      if (error) throw error;
      toast({ title: "ARC run complete", description: `${data?.scored ?? 0} users scored, ${data?.actionsDispatched ?? 0} actions dispatched` });
      await load();
    } catch (e: any) {
      toast({ title: "ARC run failed", description: e?.message ?? "Unknown error", variant: "destructive" });
    } finally {
      setRunning(false);
    }
  };

  const decide = async (id: string, decision: "approve" | "reject") => {
    setDecideId(id);
    try {
      const { data, error } = await supabase.functions.invoke("founder-action-execute", { body: { action_id: id, decision } });
      if (error) throw error;
      toast({ title: decision === "approve" ? "Action executed" : "Action rejected", description: data?.status });
      await load();
    } catch (e: any) {
      toast({ title: "Failed", description: e?.message ?? "Unknown error", variant: "destructive" });
    } finally {
      setDecideId(null);
    }
  };

  const stats = useMemo(() => {
    const phases: Record<string, number> = { attract: 0, convert: 0, retain: 0, recover: 0, champion: 0 };
    let avg = 0;
    health.forEach((h) => { phases[h.lifecycle_phase] = (phases[h.lifecycle_phase] ?? 0) + 1; avg += h.health_score; });
    return {
      avgHealth: health.length ? Math.round(avg / health.length) : 0,
      phases,
      atRisk: health.filter((h) => h.health_score < 40).length,
      pendingQueue: queue.filter((q) => q.status === "pending").length,
      actions24h: actions.filter((a) => Date.now() - new Date(a.created_at).getTime() < 24 * 3600 * 1000).length,
    };
  }, [health, actions, queue]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[var(--fos-text)]">ARC Engine</h1>
              <p className="text-xs text-[var(--fos-muted)]">Autopilot Retention &amp; Conversion · Co-Owner brain</p>
            </div>
          </div>
        </div>
        <button
          onClick={runOrchestrator}
          disabled={running}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--fos-accent)]/10 text-[var(--fos-accent)] border border-[var(--fos-accent)]/30 hover:bg-[var(--fos-accent)]/20 text-sm font-semibold disabled:opacity-50"
        >
          {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Run ARC now
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card label="Avg Health" value={`${stats.avgHealth}`} accent={healthColor(stats.avgHealth)} icon={<Heart className="w-4 h-4" />} />
        <Card label="At Risk" value={`${stats.atRisk}`} accent="text-rose-400" icon={<AlertTriangle className="w-4 h-4" />} />
        <Card label="In Convert" value={`${stats.phases.convert ?? 0}`} accent="text-purple-400" icon={<TrendingUp className="w-4 h-4" />} />
        <Card label="Queue Pending" value={`${stats.pendingQueue}`} accent="text-cyan-400" icon={<UserCheck className="w-4 h-4" />} />
        <Card label="Actions 24h" value={`${stats.actions24h}`} accent="text-emerald-400" icon={<Activity className="w-4 h-4" />} />
      </div>

      <div className="flex gap-1 border-b border-[var(--fos-border)]">
        {(["overview", "queue", "actions", "health"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${tab === t ? "border-[var(--fos-accent)] text-[var(--fos-accent)]" : "border-transparent text-[var(--fos-muted)] hover:text-[var(--fos-text)]"}`}
          >
            {t === "overview" ? "Lifecycle" : t === "queue" ? `Approval Queue${stats.pendingQueue ? ` (${stats.pendingQueue})` : ""}` : t === "actions" ? "Actions Log" : "User Health"}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {(["attract", "convert", "retain", "recover", "champion"] as const).map((p) => (
            <div key={p} className="rounded-xl border border-[var(--fos-border)] bg-[var(--fos-card)] p-4">
              <div className={`inline-block px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded border ${PHASE_COLOR[p]}`}>{p}</div>
              <div className="mt-3 text-3xl font-bold text-[var(--fos-text)]">{stats.phases[p] ?? 0}</div>
              <div className="text-xs text-[var(--fos-muted)] mt-1">users in phase</div>
            </div>
          ))}
        </div>
      )}

      {tab === "queue" && (
        <div className="space-y-2">
          {queue.length === 0 && <Empty msg="No proposed actions yet. ARC will surface high-impact decisions here." />}
          {queue.map((q) => (
            <div key={q.id} className="rounded-xl border border-[var(--fos-border)] bg-[var(--fos-card)] p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded border ${q.risk_level === "high" ? "bg-rose-500/15 text-rose-400 border-rose-500/30" : q.risk_level === "medium" ? "bg-amber-500/15 text-amber-400 border-amber-500/30" : "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"}`}>
                      {q.risk_level} risk
                    </span>
                    <span className="text-[10px] text-[var(--fos-muted)] uppercase tracking-wider">{q.proposed_by} · {q.action_type}</span>
                    <span className="text-[10px] text-[var(--fos-muted)]">{new Date(q.created_at).toLocaleString()}</span>
                  </div>
                  <div className="mt-1.5 text-sm font-semibold text-[var(--fos-text)]">{q.title}</div>
                  {q.description && <div className="text-xs text-[var(--fos-muted)] mt-1 leading-relaxed">{q.description}</div>}
                  {q.ai_reasoning && <div className="text-[11px] text-[var(--fos-muted)]/70 mt-2 italic">AI: {q.ai_reasoning}</div>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {q.status === "pending" ? (
                    <>
                      <button
                        onClick={() => decide(q.id, "reject")}
                        disabled={decideId === q.id}
                        className="p-2 rounded-lg border border-[var(--fos-border)] text-[var(--fos-muted)] hover:text-rose-400 hover:border-rose-400/40 disabled:opacity-50"
                        title="Reject"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => decide(q.id, "approve")}
                        disabled={decideId === q.id}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25 text-xs font-semibold disabled:opacity-50"
                      >
                        {decideId === q.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                        Approve
                      </button>
                    </>
                  ) : (
                    <span className={`px-2 py-1 text-[10px] font-semibold uppercase tracking-wider rounded ${q.status === "executed" ? "bg-emerald-500/15 text-emerald-400" : q.status === "rejected" ? "bg-[var(--fos-card)] text-[var(--fos-muted)]" : "bg-rose-500/15 text-rose-400"}`}>{q.status}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "actions" && (
        <div className="rounded-xl border border-[var(--fos-border)] bg-[var(--fos-card)] divide-y divide-[var(--fos-border)] overflow-hidden">
          {actions.length === 0 && <Empty msg="No automated actions yet. Run ARC or wait for the next 30-min cycle." />}
          {actions.map((a) => (
            <div key={a.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="flex items-center gap-3 min-w-0">
                <span className={`px-2 py-0.5 text-[10px] font-semibold uppercase rounded border ${PHASE_COLOR[a.phase] ?? PHASE_COLOR.retain}`}>{a.phase}</span>
                <div className="min-w-0">
                  <div className="text-sm text-[var(--fos-text)] truncate">{a.title}</div>
                  <div className="text-[11px] text-[var(--fos-muted)]">{a.action_type} · {a.channel} · {new Date(a.created_at).toLocaleString()}</div>
                </div>
              </div>
              <span className={`shrink-0 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider rounded ${a.status === "completed" ? "bg-emerald-500/15 text-emerald-400" : a.status === "failed" ? "bg-rose-500/15 text-rose-400" : a.status === "skipped" ? "bg-[var(--fos-card)] text-[var(--fos-muted)]" : "bg-cyan-500/15 text-cyan-400"}`}>{a.status}</span>
            </div>
          ))}
        </div>
      )}

      {tab === "health" && (
        <div className="rounded-xl border border-[var(--fos-border)] bg-[var(--fos-card)] overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[var(--fos-card)]/60 text-[10px] uppercase tracking-wider text-[var(--fos-muted)]">
              <tr>
                <th className="text-left px-4 py-2.5">User</th>
                <th className="text-left px-3 py-2.5">Plan</th>
                <th className="text-left px-3 py-2.5">Phase</th>
                <th className="text-right px-3 py-2.5">Health</th>
                <th className="text-right px-3 py-2.5">30d Use</th>
                <th className="text-left px-4 py-2.5">Recommended</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--fos-border)]">
              {health.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-[var(--fos-muted)] text-sm">No health snapshots yet. Click <strong>Run ARC now</strong>.</td></tr>
              )}
              {health.map((h) => (
                <tr key={h.user_id} className="hover:bg-[var(--fos-card)]/40">
                  <td className="px-4 py-2.5 font-mono text-[11px] text-[var(--fos-muted)]">{h.user_id.slice(0, 8)}</td>
                  <td className="px-3 py-2.5 text-[var(--fos-text)]">{h.plan ?? "-"}</td>
                  <td className="px-3 py-2.5"><span className={`px-2 py-0.5 text-[10px] font-semibold uppercase rounded border ${PHASE_COLOR[h.lifecycle_phase] ?? PHASE_COLOR.retain}`}>{h.lifecycle_phase}</span></td>
                  <td className={`px-3 py-2.5 text-right tabular-nums font-bold ${healthColor(h.health_score)}`}>{h.health_score}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-[var(--fos-muted)]">{h.feature_count_30d ?? 0}</td>
                  <td className="px-4 py-2.5 text-[12px] text-[var(--fos-text)]">{h.recommended_action ?? "-"}<div className="text-[10px] text-[var(--fos-muted)]">{h.recommended_action_reason}</div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Card({ label, value, icon, accent }: { label: string; value: string; icon: React.ReactNode; accent: string }) {
  return (
    <div className="rounded-xl border border-[var(--fos-border)] bg-[var(--fos-card)] p-4">
      <div className="flex items-center justify-between text-[var(--fos-muted)]">
        <span className="text-[10px] uppercase tracking-wider">{label}</span>
        <span className={accent}>{icon}</span>
      </div>
      <div className={`mt-2 text-2xl font-bold ${accent}`}>{value}</div>
    </div>
  );
}

function Empty({ msg }: { msg: string }) {
  return (
    <div className="rounded-xl border border-dashed border-[var(--fos-border)] bg-[var(--fos-card)]/40 p-8 text-center text-sm text-[var(--fos-muted)]">
      {msg}
    </div>
  );
}