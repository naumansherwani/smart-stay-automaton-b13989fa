import { useEffect, useRef, useState } from "react";
import { Bell, AlertTriangle, TrendingDown, RefreshCcw, Crown, Check, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Alert {
  id: string;
  alert_type: string;
  severity: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

const iconFor = (t: string) => {
  if (t === "payment_failed") return AlertTriangle;
  if (t === "high_value_churn") return TrendingDown;
  if (t === "refund_issued") return RefreshCcw;
  return Crown;
};

const toneFor = (s: string) => {
  if (s === "critical") return "text-[var(--fos-danger)] bg-[var(--fos-danger)]/10";
  if (s === "high") return "text-[#F59E0B] bg-[#F59E0B]/10";
  if (s === "medium") return "text-[var(--fos-accent)] bg-[var(--fos-accent)]/10";
  return "text-[var(--fos-muted)] bg-[var(--fos-card)]";
};

function relTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "now";
  if (m < 60) return m + "m ago";
  const h = Math.floor(m / 60);
  if (h < 24) return h + "h ago";
  return Math.floor(h / 24) + "d ago";
}

export default function FounderNotifications() {
  const [open, setOpen] = useState(false);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const ref = useRef<HTMLDivElement>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("admin_alerts")
      .select("id,alert_type,severity,title,message,is_read,created_at")
      .order("created_at", { ascending: false })
      .limit(20);
    setAlerts((data as Alert[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel("founder-admin-alerts")
      .on("postgres_changes", { event: "*", schema: "public", table: "admin_alerts" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const unread = alerts.filter((a) => !a.is_read).length;

  const markAll = async () => {
    const ids = alerts.filter((a) => !a.is_read).map((a) => a.id);
    if (!ids.length) return;
    setAlerts((prev) => prev.map((a) => ({ ...a, is_read: true })));
    await supabase.from("admin_alerts").update({ is_read: true }).in("id", ids);
  };

  const markOne = async (id: string) => {
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, is_read: true } : a)));
    await supabase.from("admin_alerts").update({ is_read: true }).eq("id", id);
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative w-9 h-9 rounded-lg bg-[var(--fos-card)] border border-[var(--fos-border)] hover:border-[var(--fos-accent)]/40 flex items-center justify-center text-[var(--fos-muted)] hover:text-[var(--fos-text)] transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-4 h-4" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 rounded-full bg-[var(--fos-danger)] text-white text-[9px] font-bold flex items-center justify-center tabular-nums">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+8px)] w-[380px] max-w-[92vw] rounded-xl border border-[var(--fos-border)] bg-[var(--fos-card)] shadow-2xl shadow-black/40 z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-[var(--fos-border)] flex items-center justify-between">
            <div>
              <div className="text-[var(--fos-text)] text-sm font-semibold">Notifications</div>
              <div className="text-[10px] text-[var(--fos-muted)]">{unread} unread · live updates</div>
            </div>
            {unread > 0 && (
              <button onClick={markAll} className="text-[10px] text-[var(--fos-accent)] hover:underline flex items-center gap-1">
                <Check className="w-3 h-3" /> Mark all read
              </button>
            )}
          </div>
          <div className="max-h-[480px] overflow-y-auto">
            {loading && (
              <div className="p-6 flex items-center justify-center text-[var(--fos-muted)] text-xs gap-2">
                <Loader2 className="w-3 h-3 animate-spin" /> Loading…
              </div>
            )}
            {!loading && alerts.length === 0 && (
              <div className="p-8 text-center">
                <Bell className="w-8 h-8 text-[var(--fos-muted)]/30 mx-auto mb-2" />
                <div className="text-[var(--fos-text)] text-sm font-medium">All clear</div>
                <div className="text-[var(--fos-muted)] text-xs mt-1">No notifications yet.</div>
              </div>
            )}
            {alerts.map((a) => {
              const Icon = iconFor(a.alert_type);
              return (
                <button
                  key={a.id}
                  onClick={() => markOne(a.id)}
                  className={`w-full text-left px-4 py-3 border-b border-[var(--fos-border)]/40 hover:bg-[var(--fos-bg)]/50 transition-colors flex gap-3 ${
                    !a.is_read ? "bg-[var(--fos-accent)]/[0.04]" : ""
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${toneFor(a.severity)}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-[12px] font-semibold truncate ${a.is_read ? "text-[var(--fos-muted)]" : "text-[var(--fos-text)]"}`}>
                        {a.title}
                      </span>
                      {!a.is_read && <span className="w-1.5 h-1.5 rounded-full bg-[var(--fos-accent)] shrink-0" />}
                    </div>
                    <div className="text-[11px] text-[var(--fos-muted)] mt-0.5 line-clamp-2">{a.message}</div>
                    <div className="text-[10px] text-[var(--fos-muted)]/70 mt-1">{relTime(a.created_at)}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}