import { useEffect, useRef, useState } from "react";
import { liveStreamUrl } from "@/lib/api";
import { INDUSTRY_ADVISOR } from "./types";

type Tone = "neutral" | "amber" | "green" | "cyan";
interface FeedItem {
  id: string;
  ts: number;
  text: string;
  tone: Tone;
}

const MAX_ITEMS = 50;

function fmtTime(ts: number) {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

const toneClass: Record<Tone, string> = {
  neutral: "border-l-[var(--fos-border)]",
  amber: "border-l-amber-400/80",
  green: "border-l-emerald-400/80",
  cyan: "border-l-cyan-400/80",
};

export default function LiveFeed({ active }: { active: boolean }) {
  const [items, setItems] = useState<FeedItem[]>([]);
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

      const push = (text: string, tone: Tone) => {
        const item: FeedItem = { id: `${Date.now()}-${++idRef.current}`, ts: Date.now(), text, tone };
        setItems((prev) => [item, ...prev].slice(0, MAX_ITEMS));
      };

      const advisorOf = (industry?: string) =>
        (industry && INDUSTRY_ADVISOR[industry]) || "Advisor";

      es.addEventListener("advisor.activity", (e: MessageEvent) => {
        try {
          const d = JSON.parse(e.data);
          push(`[${d.advisor || advisorOf(d.industry)}] — ${d.action || "Activity"}${d.context ? ` · ${d.context}` : ""}`, "neutral");
        } catch { /* ignore */ }
      });
      es.addEventListener("advisor.escalated", (e: MessageEvent) => {
        try {
          const d = JSON.parse(e.data);
          push(`[${advisorOf(d.industry)}] — Issue escalated to Sherlock`, "amber");
        } catch { /* ignore */ }
      });
      es.addEventListener("advisor.resolved", (e: MessageEvent) => {
        try {
          const d = JSON.parse(e.data);
          push(`[${advisorOf(d.industry)}] — Resolved in ${d.elapsed_ms ?? "?"}ms`, "green");
        } catch { /* ignore */ }
      });
      es.addEventListener("subscription.created", (e: MessageEvent) => {
        try {
          const d = JSON.parse(e.data);
          push(`[System] — New ${d.plan || "plan"} subscriber activated`, "cyan");
        } catch { /* ignore */ }
      });
      es.addEventListener("subscription.updated", (e: MessageEvent) => {
        try {
          const d = JSON.parse(e.data);
          push(`[System] — Subscription updated → ${d.plan || ""}${d.status ? ` (${d.status})` : ""}`, "neutral");
        } catch { /* ignore */ }
      });
      es.addEventListener("subscription.cancelled", () => {
        push(`[System] — Subscription cancelled`, "amber");
      });
      es.addEventListener("payment.success", (e: MessageEvent) => {
        try {
          const d = JSON.parse(e.data);
          push(`[System] — Payment received${d.amount ? ` · ${d.amount}` : ""}`, "green");
        } catch { /* ignore */ }
      });

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

  return (
    <aside className="founder-card p-4 h-[640px] flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${active ? "bg-cyan-400" : "bg-[var(--fos-muted)]"} ${active ? "animate-pulse" : ""}`} />
          <span className="text-[11px] uppercase tracking-wider text-[var(--fos-muted)] font-semibold">
            Live Intelligence
          </span>
        </div>
        <span className="text-[10px] text-[var(--fos-muted)]">{items.length}/50</span>
      </div>
      <div className="flex-1 overflow-y-auto space-y-1.5 font-mono text-[11px]">
        {!active && (
          <div className="text-[var(--fos-muted)] italic text-center py-8">Feed paused</div>
        )}
        {active && items.length === 0 && (
          <div className="text-[var(--fos-muted)] italic text-center py-8">Awaiting live activity…</div>
        )}
        {items.map((it) => (
          <div
            key={it.id}
            className={`pl-2 py-1.5 border-l-2 ${toneClass[it.tone]} bg-[var(--fos-bg)]/40 rounded-r animate-in fade-in slide-in-from-top-1 duration-300`}
          >
            <div className="text-[var(--fos-muted)] text-[9px]">{fmtTime(it.ts)}</div>
            <div className="text-[var(--fos-text)] leading-snug">{it.text}</div>
          </div>
        ))}
      </div>
    </aside>
  );
}