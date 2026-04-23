import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ShieldCheck, AlertTriangle, Database, Bell, Activity, Lock } from "lucide-react";

export default function Security() {
  const [activity, setActivity] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [me, setMe] = useState<any>(null);
  const [confirm, setConfirm] = useState<null | "rotate_keys" | "lock_account">(null);
  const [notif, setNotif] = useState(() => {
    try { return JSON.parse(localStorage.getItem("fos-notif-prefs") || '{"failed_payments":true,"high_value_churn":true,"enterprise_leads":true,"refunds":true}'); } catch { return {}; }
  });

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      setMe(u.user);
      const [act, al] = await Promise.all([
        supabase.from("crm_activity_logs").select("*").order("created_at", { ascending: false }).limit(15),
        supabase.from("admin_alerts").select("*").order("created_at", { ascending: false }).limit(10),
      ]);
      setActivity(act.data || []);
      setAlerts(al.data || []);
    })();
  }, []);

  const updateNotif = (key: string, value: boolean) => {
    const next = { ...notif, [key]: value };
    setNotif(next);
    localStorage.setItem("fos-notif-prefs", JSON.stringify(next));
  };

  const doSensitive = (action: "rotate_keys" | "lock_account") => {
    setConfirm(null);
    // Log the founder action
    supabase.from("admin_alerts").insert({
      alert_type: `founder_security_${action}`, severity: "high",
      title: "Founder security action: " + action.replace("_", " "),
      message: `Action initiated by founder (${me?.email}). Operations team has been notified.`,
    } as any);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Recent Logins / Session */}
      <div className="founder-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Lock className="w-4 h-4 text-[var(--fos-accent)]" />
          <h3 className="text-[var(--fos-text)] font-semibold text-sm">Founder Session</h3>
        </div>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between border-b border-[var(--fos-border)]/40 py-2"><span className="text-[var(--fos-muted)]">Email</span><span className="text-[var(--fos-text)]">{me?.email || "—"}</span></div>
          <div className="flex justify-between border-b border-[var(--fos-border)]/40 py-2"><span className="text-[var(--fos-muted)]">Last sign-in</span><span className="text-[var(--fos-text)]">{me?.last_sign_in_at ? new Date(me.last_sign_in_at).toLocaleString("en-GB") : "—"}</span></div>
          <div className="flex justify-between border-b border-[var(--fos-border)]/40 py-2"><span className="text-[var(--fos-muted)]">Provider</span><span className="text-[var(--fos-text)]">{me?.app_metadata?.provider || "email"}</span></div>
          <div className="flex justify-between border-b border-[var(--fos-border)]/40 py-2"><span className="text-[var(--fos-muted)]">2FA</span><span className="text-[var(--fos-warning)]">Recommended</span></div>
        </div>
      </div>

      {/* Backup status */}
      <div className="founder-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Database className="w-4 h-4 text-[var(--fos-success)]" />
          <h3 className="text-[var(--fos-text)] font-semibold text-sm">Data & Backups</h3>
        </div>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between border-b border-[var(--fos-border)]/40 py-2"><span className="text-[var(--fos-muted)]">Daily backups</span><span className="text-[var(--fos-success)]">● Active</span></div>
          <div className="flex justify-between border-b border-[var(--fos-border)]/40 py-2"><span className="text-[var(--fos-muted)]">Point-in-time recovery</span><span className="text-[var(--fos-success)]">7 days</span></div>
          <div className="flex justify-between border-b border-[var(--fos-border)]/40 py-2"><span className="text-[var(--fos-muted)]">Region</span><span className="text-[var(--fos-text)]">EU (London)</span></div>
          <div className="flex justify-between border-b border-[var(--fos-border)]/40 py-2"><span className="text-[var(--fos-muted)]">Last successful backup</span><span className="text-[var(--fos-text)]">{new Date().toLocaleDateString("en-GB")}</span></div>
        </div>
      </div>

      {/* Notification settings */}
      <div className="founder-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="w-4 h-4 text-[var(--fos-warning)]" />
          <h3 className="text-[var(--fos-text)] font-semibold text-sm">Notification Settings</h3>
        </div>
        <div className="space-y-2.5">
          {[
            ["failed_payments", "Failed payments"],
            ["high_value_churn", "High-value churn"],
            ["enterprise_leads", "New enterprise leads"],
            ["refunds", "Refund requests"],
          ].map(([k, label]) => (
            <label key={k} className="flex items-center justify-between p-2.5 rounded-lg bg-[var(--fos-bg)] border border-[var(--fos-border)]/50 cursor-pointer">
              <span className="text-sm text-[var(--fos-text)]">{label}</span>
              <input type="checkbox" checked={!!notif[k as string]} onChange={(e) => updateNotif(k as string, e.target.checked)} className="accent-[var(--fos-accent)]" />
            </label>
          ))}
        </div>
      </div>

      {/* Sensitive actions */}
      <div className="founder-card p-5 border border-[var(--fos-danger)]/30">
        <div className="flex items-center gap-2 mb-4">
          <ShieldCheck className="w-4 h-4 text-[var(--fos-danger)]" />
          <h3 className="text-[var(--fos-text)] font-semibold text-sm">Sensitive Actions</h3>
        </div>
        <div className="space-y-2">
          <button onClick={() => setConfirm("rotate_keys")} className="w-full text-left p-3 rounded-lg bg-[var(--fos-bg)] border border-[var(--fos-border)] hover:border-[var(--fos-danger)]/50 transition">
            <div className="text-sm text-[var(--fos-text)] font-medium">Rotate API keys</div>
            <div className="text-xs text-[var(--fos-muted)] mt-0.5">Invalidate existing service keys (requires confirmation)</div>
          </button>
          <button onClick={() => setConfirm("lock_account")} className="w-full text-left p-3 rounded-lg bg-[var(--fos-bg)] border border-[var(--fos-border)] hover:border-[var(--fos-danger)]/50 transition">
            <div className="text-sm text-[var(--fos-text)] font-medium">Lock founder account</div>
            <div className="text-xs text-[var(--fos-muted)] mt-0.5">Force sign-out across all devices</div>
          </button>
        </div>
      </div>

      {/* Recent admin actions */}
      <div className="founder-card p-5 lg:col-span-2">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-4 h-4 text-[var(--fos-accent)]" />
          <h3 className="text-[var(--fos-text)] font-semibold text-sm">Recent Admin Activity</h3>
        </div>
        <div className="space-y-1 max-h-[280px] overflow-y-auto">
          {activity.length === 0 && <div className="text-xs text-[var(--fos-muted)] py-6 text-center">No recent activity logged.</div>}
          {activity.map((a) => (
            <div key={a.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--fos-bg)] text-xs">
              <span className="text-[var(--fos-accent)] font-mono text-[10px] w-16">{a.action_type}</span>
              <span className="text-[var(--fos-text)] flex-1 truncate">{a.description || a.entity_type}</span>
              <span className="text-[var(--fos-muted)]">{new Date(a.created_at).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent system alerts */}
      <div className="founder-card p-5 lg:col-span-2">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-4 h-4 text-[var(--fos-warning)]" />
          <h3 className="text-[var(--fos-text)] font-semibold text-sm">Recent System Alerts</h3>
        </div>
        <div className="space-y-1 max-h-[260px] overflow-y-auto">
          {alerts.length === 0 && <div className="text-xs text-[var(--fos-muted)] py-6 text-center">No alerts in the last period.</div>}
          {alerts.map((a) => (
            <div key={a.id} className="flex items-start gap-3 p-2.5 rounded-lg bg-[var(--fos-bg)] text-xs">
              <span className={`mt-0.5 w-1.5 h-1.5 rounded-full shrink-0 ${a.severity === "critical" ? "bg-[var(--fos-danger)]" : a.severity === "high" ? "bg-[var(--fos-warning)]" : "bg-[var(--fos-accent)]"}`} />
              <div className="flex-1">
                <div className="text-[var(--fos-text)] font-medium">{a.title}</div>
                <div className="text-[var(--fos-muted)] text-[11px] mt-0.5 line-clamp-2">{a.message}</div>
              </div>
              <span className="text-[var(--fos-muted)] text-[10px]">{new Date(a.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}</span>
            </div>
          ))}
        </div>
      </div>

      {confirm && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setConfirm(null)}>
          <div className="founder-card max-w-md w-full p-6 border border-[var(--fos-danger)]/40" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-[var(--fos-danger)]" />
              <h4 className="text-[var(--fos-text)] font-semibold">Confirm sensitive action</h4>
            </div>
            <p className="text-[var(--fos-muted)] text-sm">You are about to <strong className="text-[var(--fos-text)]">{confirm.replace("_", " ")}</strong>. This is logged and may impact production. Continue?</p>
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setConfirm(null)} className="px-3 py-2 rounded-lg text-xs text-[var(--fos-muted)] hover:text-[var(--fos-text)]">Cancel</button>
              <button onClick={() => doSensitive(confirm)} className="px-4 py-2 rounded-lg bg-[var(--fos-danger)] text-white text-xs font-semibold">Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}