import { useEffect, useRef, useState } from "react";
import { liveStreamUrl } from "@/lib/api";
import { INDUSTRY_ADVISOR } from "./types";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";

type Tone = "neutral" | "amber" | "green" | "cyan" | "red";
type FeedKind = "activity" | "escalated" | "resolved" | "pricing" | "system";
interface FeedItem {
  id: string;
  ts: number;
  text: string;
  subtext?: string;
  tone: Tone;
  kind: FeedKind;
  payload?: any;
}

const MAX_ITEMS = 20;

function fmtTime(ts: number) {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

const toneClass: Record<Tone, string> = {
  neutral: "border-l-[var(--fos-border)]",
  amber: "border-l-amber-400/80",
  green: "border-l-emerald-400/80",
  cyan: "border-l-cyan-400/80",
  red: "border-l-red-500/80",
};

export default function LiveFeed({ active }: { active: boolean }) {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [filter, setFilter] = useState<"all" | "escalated" | "pricing" | "resolved">("all");
  const [selected, setSelected] = useState<FeedItem | null>(null);
  const esRef = useRef<EventSource | null>(null);
  const idRef = useRef(0);

  useEffect(() => {
    if (!active) {
      esRef.current?.close();
      esRef.current = null;
      return;
    }
    let cancelled = false;
    const connect = () => {
      if (cancelled) return;
      const es = new EventSource(liveStreamUrl());
      esRef.current = es;

      const push = (text: string, tone: Tone, kind: FeedKind, subtext?: string, payload?: any) => {
        const item: FeedItem = { id: `${Date.now()}-${++idRef.current}`, ts: Date.now(), text, subtext, tone, kind, payload };
        setItems((prev) => [item, ...prev].slice(0, MAX_ITEMS));
      };

      const advisorOf = (industry?: string) =>
        (industry && INDUSTRY_ADVISOR[industry]) || "Advisor";

      es.addEventListener("advisor.activity", (e: MessageEvent) => {
        try {
          const d = JSON.parse(e.data);
          const ctx = typeof d.context === "string" ? d.context.slice(0, 140) : "";
          push(
            `[${d.advisor || advisorOf(d.industry)}] — ${d.action || "Activity"}`,
            "neutral",
            "activity",
            ctx || undefined,
            d,
          );
        } catch { /* ignore */ }
      });
      es.addEventListener("advisor.escalated", (e: MessageEvent) => {
        try {
          const d = JSON.parse(e.data);
          const issueRef = d.issue_id ? ` · Issue #${d.issue_id}` : "";
          push(
            `[${advisorOf(d.industry)}] — Escalated to Sherlock${issueRef}`,
            "red",
            "escalated",
            d.elapsed_ms ? `${Math.round(d.elapsed_ms / 1000)}s elapsed` : undefined,
            d,
          );
        } catch { /* ignore */ }
      });
      es.addEventListener("advisor.resolved", (e: MessageEvent) => {
        try {
          const d = JSON.parse(e.data);
          push(`[${advisorOf(d.industry)}] — Resolved in ${d.elapsed_ms ?? "?"}ms`, "green", "resolved", undefined, d);
        } catch { /* ignore */ }
      });
      es.addEventListener("advisor.pricing_action", (e: MessageEvent) => {
        try {
          const d = JSON.parse(e.data);
          const issueRef = d.issueId ? ` · Issue #${d.issueId}` : "";
          push(
            `[${advisorOf(d.industry)}] — Auto-pricing action${issueRef}`,
            "amber",
            "pricing",
            typeof d.action === "string" ? d.action.slice(0, 140) : undefined,
            d,
          );
        } catch { /* ignore */ }
      });
      es.addEventListener("subscription.created", (e: MessageEvent) => {
        try {
          const d = JSON.parse(e.data);
          push(`[System] — New ${d.plan || "plan"} subscriber activated`, "cyan", "system", undefined, d);
        } catch { /* ignore */ }
      });
      es.addEventListener("subscription.updated", (e: MessageEvent) => {
        try {
          const d = JSON.parse(e.data);
          push(`[System] — Subscription updated → ${d.plan || ""}${d.status ? ` (${d.status})` : ""}`, "neutral", "system", undefined, d);
        } catch { /* ignore */ }
      });
      es.addEventListener("subscription.cancelled", () => {
        push(`[System] — Subscription cancelled`, "amber", "system");
      });
      es.addEventListener("payment.success", (e: MessageEvent) => {
        try {
          const d = JSON.parse(e.data);
          push(`[System] — Payment received${d.amount ? ` · ${d.amount}` : ""}`, "green", "system", undefined, d);
        } catch { /* ignore */ }
      });
      // Phase 2 — policy/pricing config sync. Backend emits when /settings or
      // /founder/pricing rules change so live advisors can pick up new rules
      // without a refresh.
      const handlePolicyUpdate = (e: MessageEvent) => {
        try {
          const d = JSON.parse(e.data);
          push(
            `[Policy] — ${d.scope || "Config"} updated${d.industry ? ` · ${d.industry}` : ""}`,
            "cyan",
            "system",
            typeof d.summary === "string" ? d.summary.slice(0, 140) : undefined,
            d,
          );
          // Broadcast for any open advisor / pricing panel to refetch.
          window.dispatchEvent(new CustomEvent("hf:policy-updated", { detail: d }));
        } catch { /* ignore */ }
      };
      es.addEventListener("policy.updated", handlePolicyUpdate);
      es.addEventListener("pricing.config_updated", handlePolicyUpdate);

      es.onerror = () => {
        es.close();
        esRef.current = null;
        if (!cancelled) setTimeout(connect, 3000);
      };
    };
    connect();
    return () => {
      cancelled = true;
      esRef.current?.close();
      esRef.current = null;
    };
  }, [active]);

  const filtered = items.filter((it) => {
    if (filter === "all") return true;
    if (filter === "escalated") return it.kind === "escalated";
    if (filter === "pricing") return it.kind === "pricing";
    if (filter === "resolved") return it.kind === "resolved";
    return true;
  });

  const FILTERS: { key: typeof filter; label: string; count: number }[] = [
    { key: "all", label: "All", count: items.length },
    { key: "escalated", label: "Escalated", count: items.filter(i => i.kind === "escalated").length },
    { key: "pricing", label: "Pricing", count: items.filter(i => i.kind === "pricing").length },
    { key: "resolved", label: "Resolved", count: items.filter(i => i.kind === "resolved").length },
  ];

  return (
    <aside className="founder-card p-4 h-[640px] flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${active ? "bg-cyan-400" : "bg-[var(--fos-muted)]"} ${active ? "animate-pulse" : ""}`} />
          <span className="text-[11px] uppercase tracking-wider text-[var(--fos-muted)] font-semibold">
            Live Intelligence
          </span>
        </div>
        <span className="text-[10px] text-[var(--fos-muted)]">{filtered.length}/{items.length}</span>
      </div>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`text-[10px] uppercase tracking-wider px-2 py-1 rounded-full border transition ${
              filter === f.key
                ? "bg-cyan-400/15 border-cyan-400/50 text-cyan-300"
                : "bg-transparent border-[var(--fos-border)] text-[var(--fos-muted)] hover:text-[var(--fos-text)]"
            }`}
          >
            {f.label} <span className="opacity-60">{f.count}</span>
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto space-y-1.5 font-mono text-[11px]">
        {!active && (
          <div className="text-[var(--fos-muted)] italic text-center py-8">Feed paused</div>
        )}
        {active && filtered.length === 0 && items.length === 0 && (
          <div className="text-[var(--fos-muted)] italic text-center py-8">Awaiting live activity…</div>
        )}
        {active && filtered.length === 0 && items.length > 0 && (
          <div className="text-[var(--fos-muted)] italic text-center py-8">No matches for this filter</div>
        )}
        {filtered.map((it) => (
          <button
            key={it.id}
            onClick={() => setSelected(it)}
            className={`w-full text-left pl-2 py-1.5 border-l-2 ${toneClass[it.tone]} bg-[var(--fos-bg)]/40 rounded-r animate-in fade-in slide-in-from-top-1 duration-300 hover:bg-[var(--fos-bg)]/70 transition`}
          >
            <div className="text-[var(--fos-muted)] text-[9px]">{fmtTime(it.ts)}</div>
            <div className="text-[var(--fos-text)] leading-snug">{it.text}</div>
            {it.subtext && (
              <div className="text-[var(--fos-muted)] text-[10px] leading-snug mt-0.5 line-clamp-2 font-sans">
                {it.subtext}
              </div>
            )}
          </button>
        ))}
      </div>
      <Sheet open={!!selected} onOpenChange={(v) => !v && setSelected(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-sm">{selected?.text}</SheetTitle>
            <SheetDescription className="text-xs">
              {selected ? new Date(selected.ts).toLocaleString() : ""}
            </SheetDescription>
          </SheetHeader>
          {selected?.kind === "pricing" && selected.payload && (
            <div className="mt-4 space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                {selected.payload.industry && (
                  <div className="p-2 rounded bg-muted/40">
                    <div className="text-[10px] uppercase text-muted-foreground">Industry</div>
                    <div className="font-medium">{String(selected.payload.industry).replace(/_/g, " ")}</div>
                  </div>
                )}
                {selected.payload.advisor && (
                  <div className="p-2 rounded bg-muted/40">
                    <div className="text-[10px] uppercase text-muted-foreground">Advisor</div>
                    <div className="font-medium">{selected.payload.advisor}</div>
                  </div>
                )}
                {(selected.payload.resource || selected.payload.room || selected.payload.route) && (
                  <div className="p-2 rounded bg-muted/40 col-span-2">
                    <div className="text-[10px] uppercase text-muted-foreground">Target</div>
                    <div className="font-medium">{selected.payload.resource || selected.payload.room || selected.payload.route}</div>
                  </div>
                )}
                {selected.payload.old_price !== undefined && (
                  <div className="p-2 rounded bg-muted/40">
                    <div className="text-[10px] uppercase text-muted-foreground">Old price</div>
                    <div className="font-mono">{selected.payload.old_price}</div>
                  </div>
                )}
                {selected.payload.new_price !== undefined && (
                  <div className="p-2 rounded bg-amber-500/10 border border-amber-500/20">
                    <div className="text-[10px] uppercase text-amber-500">New price</div>
                    <div className="font-mono font-semibold">{selected.payload.new_price}</div>
                  </div>
                )}
              </div>
              {selected.payload.action && (
                <div className="p-3 rounded bg-muted/40 border border-border/40">
                  <div className="text-[10px] uppercase text-muted-foreground mb-1">Action</div>
                  <div className="text-sm">{selected.payload.action}</div>
                </div>
              )}
            </div>
          )}
          {selected?.payload && (
            <details className="mt-4">
              <summary className="text-xs uppercase tracking-wider text-muted-foreground cursor-pointer">Raw payload</summary>
              <pre className="mt-2 p-3 rounded bg-muted/40 text-[10px] font-mono overflow-x-auto whitespace-pre-wrap break-all">
                {JSON.stringify(selected.payload, null, 2)}
              </pre>
            </details>
          )}
        </SheetContent>
      </Sheet>
    </aside>
  );
}